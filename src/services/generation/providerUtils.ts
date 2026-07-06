import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/** Single source of truth for where generated files live on disk — also
 * used by src/index.ts to mount static serving at the matching /media/* route. */
export const IMAGES_ROOT = path.resolve(process.cwd(), "assets/images");
export const VIDEOS_ROOT = path.resolve(process.cwd(), "assets/videos");

/**
 * Shared "write a generated asset to disk" step used by every provider
 * (stub and real): resolve the per-character directory, ensure it exists,
 * and write the file under `${assetId}.${ext}`. Returns the file path.
 */
export async function persistGeneratedFile(
  outputRoot: string,
  characterId: string,
  assetId: string,
  ext: string,
  data: string | Buffer
): Promise<string> {
  const dir = path.join(outputRoot, characterId);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${assetId}.${ext}`);
  await writeFile(filePath, data);
  return filePath;
}

/** Shared "throw a readable error for a non-2xx fetch response" step. */
export async function assertOk(response: Response, label: string): Promise<void> {
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${label} error ${response.status}: ${detail}`);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Maps a ContentAsset's stored filesystem path to the public URL it's
 * served under via the /media/images and /media/videos static routes
 * mounted in src/index.ts. Returns null for anything not under the
 * expected root (no filePath yet, or a path from before this convention). */
export function toMediaUrl(filePath: string | null, isVideo: boolean): string | null {
  if (!filePath) return null;
  const root = isVideo ? VIDEOS_ROOT : IMAGES_ROOT;
  const rel = path.relative(root, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return `/media/${isVideo ? "videos" : "images"}/${rel.split(path.sep).join("/")}`;
}
