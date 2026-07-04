import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../middleware/errorHandler.js";
import { getImageProvider, getVideoProvider } from "./generation/providerFactory.js";

export interface AssetGenerationOutcome {
  assetId: string;
  status: "ASSET_GENERATED" | "FAILED";
  filePath?: string;
  error?: string;
}

/**
 * Calls the configured image/video provider for one already-prompted
 * ContentAsset (status PROMPT_GENERATED) and persists the result. Real
 * providers hit paid, rate-limited external APIs, so callers should not
 * assume this is fast or free — see providerFactory.ts for which vendor is
 * active.
 */
export async function generateAssetFile(assetId: string): Promise<AssetGenerationOutcome> {
  const asset = await prisma.contentAsset.findUnique({ where: { id: assetId } });
  if (!asset) throw new AppError("Content asset not found", 404);
  if (asset.status !== "PROMPT_GENERATED") {
    throw new AppError(`Asset ${assetId} is in status ${asset.status}, expected PROMPT_GENERATED`, 400);
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
          })
        : await getImageProvider().generate({
            assetId: asset.id,
            characterId: asset.characterId,
            prompt: asset.prompt,
            negativePrompt: asset.negativePrompt,
          });

    await prisma.contentAsset.update({
      where: { id: asset.id },
      data: { status: "ASSET_GENERATED", filePath: result.filePath },
    });

    return { assetId: asset.id, status: "ASSET_GENERATED", filePath: result.filePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, assetId: asset.id }, "Asset generation failed");
    return { assetId: asset.id, status: "FAILED", error: message };
  }
}

/**
 * Generates files for a batch of assets sequentially (not in parallel) —
 * video generation in particular involves multi-minute polling against a
 * rate-limited API, so one failure is captured per-item rather than
 * aborting the whole batch.
 */
export async function generateAssetFiles(assetIds: string[]): Promise<AssetGenerationOutcome[]> {
  const outcomes: AssetGenerationOutcome[] = [];
  for (const assetId of assetIds) {
    outcomes.push(await generateAssetFile(assetId));
  }
  return outcomes;
}
