import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { logger } from "../../utils/logger.js";
import type { GenerationRequest, GenerationResult } from "./imageProvider.js";

export interface VideoGenerationRequest extends GenerationRequest {
  videoStructure?: { hook: string; body: string; ending: string; cta: string } | undefined;
}

export interface VideoGenerationProvider {
  readonly name: string;
  generate(req: VideoGenerationRequest): Promise<GenerationResult>;
}

const OUTPUT_ROOT = path.resolve(process.cwd(), "assets/videos");

/**
 * Offline/dev provider for video. Real video-generation APIs (Runway,
 * Pika, etc.) are async job-based and vary a lot in shape, so rather than
 * guess one, this stub writes the full job spec (prompt + hook/body/ending/cta)
 * as a JSON "ticket" file that a human or a real provider integration can
 * pick up. Swap VIDEO_GEN_PROVIDER once a specific vendor is chosen.
 */
export class LocalStubVideoProvider implements VideoGenerationProvider {
  readonly name = "local-stub";

  async generate(req: VideoGenerationRequest): Promise<GenerationResult> {
    const dir = path.join(OUTPUT_ROOT, req.characterId);
    await mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${req.assetId}.json`);
    const ticket = {
      status: "PENDING_MANUAL_OR_PROVIDER_GENERATION",
      assetId: req.assetId,
      prompt: req.prompt,
      videoStructure: req.videoStructure ?? null,
      durationSeconds: "15-30",
      aspectRatio: "9:16",
      note: "Pass `prompt` to your video generation tool of choice (Runway, Pika, etc.) or produce manually using the hook/body/ending/cta structure.",
    };
    await writeFile(filePath, JSON.stringify(ticket, null, 2), "utf-8");

    logger.info({ assetId: req.assetId, filePath }, "LocalStubVideoProvider: job ticket written");
    return { filePath, provider: this.name };
  }
}
