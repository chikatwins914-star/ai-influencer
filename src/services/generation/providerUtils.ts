import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

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
