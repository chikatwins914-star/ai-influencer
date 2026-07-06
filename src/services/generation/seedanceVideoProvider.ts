import { config } from "../../../config/index.js";
import { logger } from "../../utils/logger.js";
import type { GenerationResult } from "./imageProvider.js";
import type { VideoGenerationProvider, VideoGenerationRequest } from "./videoProvider.js";
import { VIDEOS_ROOT, assertOk, persistGeneratedFile, sleep } from "./providerUtils.js";

const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
// Confirm against the Volcengine Ark console at activation time — ByteDance's
// model ids for new releases can shift as they roll out of preview.
const MODEL_ID = "doubao-seedance-2-0-260128";
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 60; // ~5 minutes

/**
 * Real provider wiring for ByteDance's Seedance 2.0 video model via the
 * official Volcengine Ark API (https://ark.cn-beijing.volces.com). Video
 * generation there is async: submit a task, then poll it until it reaches a
 * terminal status. NOT exercised in this sandbox (no network access here)
 * — this is the integration point to activate once VIDEO_GEN_PROVIDER=seedance
 * and VIDEO_GEN_API_KEY (an Ark API key) are set in a real deployment.
 * Ark's generated video URLs expire ~24h after task completion, so the
 * result is downloaded immediately rather than stored as a link.
 */
export class SeedanceVideoProvider implements VideoGenerationProvider {
  readonly name = "seedance";

  async generate(req: VideoGenerationRequest): Promise<GenerationResult> {
    if (!config.generation.videoGenApiKey) {
      throw new Error("VIDEO_GEN_API_KEY is not set — cannot use the seedance provider");
    }

    const taskId = await this.submitTask(req);
    const videoUrl = await this.pollUntilComplete(taskId);
    const filePath = await this.download(videoUrl, req.characterId, req.assetId);

    logger.info({ assetId: req.assetId, filePath, taskId }, "SeedanceVideoProvider: video generated");
    return { filePath, provider: this.name };
  }

  private async submitTask(req: VideoGenerationRequest): Promise<string> {
    const response = await fetch(`${ARK_BASE_URL}/contents/generations/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.generation.videoGenApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        content: [{ type: "text", text: buildPromptText(req) }],
      }),
    });

    await assertOk(response, "Seedance (Ark) API");

    const json = (await response.json()) as { id?: string };
    if (!json.id) throw new Error("Seedance (Ark) task creation response did not include a task id");
    return json.id;
  }

  private async pollUntilComplete(taskId: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(`${ARK_BASE_URL}/contents/generations/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${config.generation.videoGenApiKey}` },
      });

      await assertOk(response, "Seedance (Ark) API");

      const json = (await response.json()) as ArkTaskStatusResponse;
      if (json.status === "succeeded") {
        const videoUrl = json.content?.video_url;
        if (!videoUrl) throw new Error("Seedance (Ark) task succeeded but response had no video_url");
        return videoUrl;
      }
      if (json.status === "failed") {
        throw new Error(`Seedance (Ark) task failed: ${json.error?.message ?? "unknown error"}`);
      }

      const isLastAttempt = attempt === MAX_POLL_ATTEMPTS - 1;
      if (!isLastAttempt) await sleep(POLL_INTERVAL_MS);
    }
    throw new Error(`Seedance (Ark) task ${taskId} did not complete within the polling window`);
  }

  private async download(videoUrl: string, characterId: string, assetId: string): Promise<string> {
    const response = await fetch(videoUrl);
    await assertOk(response, "Seedance (Ark) video download");

    return persistGeneratedFile(VIDEOS_ROOT, characterId, assetId, "mp4", Buffer.from(await response.arrayBuffer()));
  }
}

function buildPromptText(req: VideoGenerationRequest): string {
  if (!req.videoStructure) return req.prompt;
  const { hook, body, ending, cta } = req.videoStructure;
  return [req.prompt, `Hook: ${hook}`, `Body: ${body}`, `Ending: ${ending}`, `CTA: ${cta}`].join("\n\n");
}

interface ArkTaskStatusResponse {
  status?: "queued" | "running" | "succeeded" | "failed";
  content?: { video_url?: string };
  error?: { message?: string };
}
