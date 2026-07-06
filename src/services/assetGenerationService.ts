import path from "node:path";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { getImageProvider, getVideoProvider } from "./generation/providerFactory.js";
import { sleep } from "./generation/providerUtils.js";

export interface AssetGenerationOutcome {
  assetId: string;
  status: "ASSET_GENERATED" | "FAILED";
  filePath?: string;
  error?: string;
}

type ContentAssetRow = Awaited<ReturnType<typeof prisma.contentAsset.findMany>>[number];

/** How many assets to generate concurrently in one batch — bounds both
 * total wall-clock time and simultaneous load on rate-limited paid APIs. */
const BATCH_CONCURRENCY = 4;

const DB_PERSIST_RETRY_ATTEMPTS = 3;

/**
 * Calls the configured image/video provider for one already-prompted
 * ContentAsset (status PROMPT_GENERATED) and persists the result. Real
 * providers hit paid, rate-limited external APIs, so callers should not
 * assume this is fast or free — see providerFactory.ts for which vendor is
 * active. Never throws: every failure mode (asset missing, wrong status,
 * provider error, DB write error) is reported as a FAILED outcome so batch
 * callers never lose already-completed (and possibly already-billed)
 * results to one bad item.
 */
export async function generateAssetFile(assetId: string): Promise<AssetGenerationOutcome> {
  const asset = await prisma.contentAsset.findUnique({ where: { id: assetId } });
  const referenceImagePaths = asset ? await getReferenceImagePaths(asset.characterId) : [];
  return generateFromAsset(assetId, asset, referenceImagePaths);
}

/** Reads a character's stored reference photo paths (JSON-encoded, relative
 * to the repo root) and resolves them to absolute paths on disk. */
async function getReferenceImagePaths(characterId: string): Promise<string[]> {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { referenceImages: true },
  });
  return resolveReferenceImagePaths(character?.referenceImages);
}

function resolveReferenceImagePaths(referenceImagesJson: string | null | undefined): string[] {
  if (!referenceImagesJson) return [];
  try {
    const parsed: unknown = JSON.parse(referenceImagesJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === "string").map((p) => path.resolve(process.cwd(), p));
  } catch {
    return [];
  }
}

async function generateFromAsset(
  assetId: string,
  asset: ContentAssetRow | null,
  referenceImagePaths: string[] = []
): Promise<AssetGenerationOutcome> {
  if (!asset) {
    return { assetId, status: "FAILED", error: "Content asset not found" };
  }
  if (asset.status !== "PROMPT_GENERATED") {
    return { assetId, status: "FAILED", error: `Asset ${assetId} is in status ${asset.status}, expected PROMPT_GENERATED` };
  }

  try {
    const result =
      asset.type === "VIDEO_REEL"
        ? await getVideoProvider().generate({
            assetId: asset.id,
            characterId: asset.characterId,
            prompt: asset.prompt,
            negativePrompt: asset.negativePrompt,
            videoStructure: asset.videoStructure ? JSON.parse(asset.videoStructure) : undefined,
            referenceImagePaths,
          })
        : await getImageProvider().generate({
            assetId: asset.id,
            characterId: asset.characterId,
            prompt: asset.prompt,
            negativePrompt: asset.negativePrompt,
            referenceImagePaths,
          });

    // Generation already succeeded (and, with a real provider, already cost
    // money) at this point, so the DB write gets a few retries — a stranded
    // transient DB error here would otherwise look identical to a failed,
    // safe-to-retry generation and risk paying for the same asset twice.
    await persistGeneratedStatus(asset.id, result.filePath);

    return { assetId: asset.id, status: "ASSET_GENERATED", filePath: result.filePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, assetId: asset.id }, "Asset generation failed");
    return { assetId: asset.id, status: "FAILED", error: message };
  }
}

async function persistGeneratedStatus(assetId: string, filePath: string): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= DB_PERSIST_RETRY_ATTEMPTS; attempt++) {
    try {
      await prisma.contentAsset.update({
        where: { id: assetId },
        data: { status: "ASSET_GENERATED", filePath },
      });
      return;
    } catch (err) {
      lastErr = err;
      logger.warn({ err, assetId, attempt }, "Failed to persist generated asset status — retrying");
      if (attempt < DB_PERSIST_RETRY_ATTEMPTS) await sleep(500 * attempt);
    }
  }
  logger.error(
    { err: lastErr, assetId, filePath },
    "Asset file was generated but DB status update failed after retries — manual reconciliation needed"
  );
  throw new Error(
    `Generated file at ${filePath} but failed to persist DB status after ${DB_PERSIST_RETRY_ATTEMPTS} attempts — ` +
      "manual reconciliation needed; do not blindly retry generation, the file already exists"
  );
}

/**
 * Generates files for a batch of assets with bounded concurrency (see
 * BATCH_CONCURRENCY) rather than one at a time — independent assets don't
 * need to be serialized, and this keeps total request time closer to
 * (batch size / concurrency) instead of the sum of every item's duration.
 * Looks up all rows in one query instead of one findUnique per asset.
 */
export async function generateAssetFiles(assetIds: string[]): Promise<AssetGenerationOutcome[]> {
  const uniqueIds = [...new Set(assetIds)];
  const assets = await prisma.contentAsset.findMany({ where: { id: { in: uniqueIds } } });
  const assetById = new Map(assets.map((a) => [a.id, a]));

  const characterIds = [...new Set(assets.map((a) => a.characterId))];
  const characters = await prisma.character.findMany({
    where: { id: { in: characterIds } },
    select: { id: true, referenceImages: true },
  });
  const referenceImagePathsByCharacterId = new Map(
    characters.map((c) => [c.id, resolveReferenceImagePaths(c.referenceImages)])
  );

  const outcomes: AssetGenerationOutcome[] = new Array(uniqueIds.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= uniqueIds.length) return;
      const assetId = uniqueIds[index]!;
      const asset = assetById.get(assetId) ?? null;
      const referenceImagePaths = asset ? referenceImagePathsByCharacterId.get(asset.characterId) ?? [] : [];
      outcomes[index] = await generateFromAsset(assetId, asset, referenceImagePaths);
    }
  }

  const workerCount = Math.min(BATCH_CONCURRENCY, uniqueIds.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return outcomes;
}
