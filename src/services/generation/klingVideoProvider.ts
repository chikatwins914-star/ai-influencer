import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { config } from "../../../config/index.js";
import { logger } from "../../utils/logger.js";
import type { GenerationResult } from "./imageProvider.js";
import type { VideoGenerationProvider, VideoGenerationRequest } from "./videoProvider.js";
import { VIDEOS_ROOT, assertOk, persistGeneratedFile, sleep } from "./providerUtils.js";

const KLING_BASE_URL = "https://api.klingai.com";
// Confirm against the KlingAI Open Platform console at activation time —
// model ids for new releases can shift as they roll out of preview.
const MODEL_ID = "kling-v2-5-turbo";
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 60; // ~5 minutes
const JWT_TTL_SECONDS = 1800;

type KlingMode = "image2video" | "text2video";

/**
 * Real provider wiring for Kling AI's video generation via the official
 * KlingAI Open Platform API (https://api.klingai.com). NOT exercised in this
 * sandbox (no network access to api.klingai.com here) — this is the
 * integration point to activate once VIDEO_GEN_PROVIDER=kling and
 * KLING_ACCESS_KEY/KLING_SECRET_KEY are set in a real deployment. Confirm
 * MODEL_ID and endpoint paths against the KlingAI Open Platform docs at
 * activation time.
 *
 * Auth uses a short-lived JWT signed with the account's Access/Secret key
 * pair (not a plain bearer token like Seedance/Gemini) — see buildJwt().
 *
 * Generation is async: submit a task, then poll it until it reaches a
 * terminal status, same shape as SeedanceVideoProvider. When the character
 * has a reference photo, this submits image-to-video instead of
 * text-to-video — the photo becomes the video's first frame, which anchors
 * the face far more reliably than text-only prompting.
 */
export class KlingVideoProvider implements VideoGenerationProvider {
  readonly name = "kling";

  async generate(req: VideoGenerationRequest): Promise<GenerationResult> {
    if (!config.generation.klingAccessKey || !config.generation.klingSecretKey) {
      throw new Error("KLING_ACCESS_KEY / KLING_SECRET_KEY are not set — cannot use the kling provider");
    }

    const referencePath = req.referenceImagePaths?.[0];
    const mode: KlingMode = referencePath ? "image2video" : "text2video";
    const taskId = await this.submitTask(req, mode, referencePath);
    const videoUrl = await this.pollUntilComplete(taskId, mode);
    const filePath = await this.download(videoUrl, req.characterId, req.assetId);

    logger.info({ assetId: req.assetId, filePath, taskId, mode }, "KlingVideoProvider: video generated");
    return { filePath, provider: this.name };
  }

  private async submitTask(req: VideoGenerationRequest, mode: KlingMode, referencePath?: string): Promise<string> {
    const body: Record<string, unknown> = {
      model_name: MODEL_ID,
      prompt: buildPromptText(req),
      aspect_ratio: "9:16",
    };
    if (req.negativePrompt) body.negative_prompt = req.negativePrompt;
    if (mode === "image2video" && referencePath) {
      body.image = (await readFile(referencePath)).toString("base64");
    }

    const response = await fetch(`${KLING_BASE_URL}/v1/videos/${mode}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.buildJwt()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    await assertOk(response, "Kling AI API");

    const json = (await response.json()) as KlingTaskResponse;
    const taskId = json.data?.task_id;
    if (!taskId) throw new Error("Kling AI task creation response did not include a task id");
    return taskId;
  }

  private async pollUntilComplete(taskId: string, mode: KlingMode): Promise<string> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(`${KLING_BASE_URL}/v1/videos/${mode}/${taskId}`, {
        headers: { Authorization: `Bearer ${this.buildJwt()}` },
      });

      await assertOk(response, "Kling AI API");

      const json = (await response.json()) as KlingTaskResponse;
      const status = json.data?.task_status;
      if (status === "succeed") {
        const videoUrl = json.data?.task_result?.videos?.[0]?.url;
        if (!videoUrl) throw new Error("Kling AI task succeeded but response had no video url");
        return videoUrl;
      }
      if (status === "failed") {
        throw new Error(`Kling AI task failed: ${json.data?.task_status_msg ?? "unknown error"}`);
      }

      const isLastAttempt = attempt === MAX_POLL_ATTEMPTS - 1;
      if (!isLastAttempt) await sleep(POLL_INTERVAL_MS);
    }
    throw new Error(`Kling AI task ${taskId} did not complete within the polling window`);
  }

  private async download(videoUrl: string, characterId: string, assetId: string): Promise<string> {
    const response = await fetch(videoUrl);
    await assertOk(response, "Kling AI video download");

    return persistGeneratedFile(VIDEOS_ROOT, characterId, assetId, "mp4", Buffer.from(await response.arrayBuffer()));
  }

  /** Builds a fresh JWT per request rather than caching one — a single
   * token wouldn't reliably survive the ~5 minute poll window. */
  private buildJwt(): string {
    const accessKey = config.generation.klingAccessKey!;
    const secretKey = config.generation.klingSecretKey!;
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64url(JSON.stringify({ iss: accessKey, exp: now + JWT_TTL_SECONDS, nbf: now - 5 }));
    const signature = base64url(createHmac("sha256", secretKey).update(`${header}.${payload}`).digest());
    return `${header}.${payload}.${signature}`;
  }
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildPromptText(req: VideoGenerationRequest): string {
  if (!req.videoStructure) return req.prompt;
  const { hook, body, ending, cta } = req.videoStructure;
  return [req.prompt, `Hook: ${hook}`, `Body: ${body}`, `Ending: ${ending}`, `CTA: ${cta}`].join("\n\n");
}

interface KlingTaskResponse {
  data?: {
    task_id?: string;
    task_status?: "submitted" | "processing" | "succeed" | "failed";
    task_status_msg?: string;
    task_result?: { videos?: Array<{ url?: string }> };
  };
}
