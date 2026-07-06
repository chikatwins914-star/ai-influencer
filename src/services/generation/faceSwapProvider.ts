import { readFile } from "node:fs/promises";
import Replicate from "replicate";
import { config } from "../../../config/index.js";
import { assertOk, sleep } from "./providerUtils.js";

export interface FaceSwapProvider {
  readonly name: string;
  /** Returns the swapped image bytes, or null if no swap was performed
   * (e.g. the noop provider). */
  swap(referencePhotoPath: string, generatedImagePath: string): Promise<Buffer | null>;
}

/** Default when FACE_SWAP_PROVIDER isn't configured — leaves the
 * generated image untouched. */
export class NoopFaceSwapProvider implements FaceSwapProvider {
  readonly name = "none";

  async swap(): Promise<Buffer | null> {
    return null;
  }
}

// https://replicate.com/cdingram/face-swap/versions — only one version
// published; re-check that page if this ever needs bumping.
const MODEL = "cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdea7cddca9968ffe38b8" as const;

/**
 * Real provider wiring for a Replicate-hosted face-swap model
 * (https://replicate.com), via Replicate's official Node.js client rather
 * than a hand-rolled HTTP call — a hand-rolled /v1/predictions call that
 * matched Replicate's own documented request byte-for-byte still got a
 * persistent 422 "Invalid version or not permitted" in production (model,
 * version, token, and billing were all independently confirmed fine via
 * the model's Playground and account billing page), so the official
 * client removes any possibility of a subtle mismatch in how this project
 * was constructing that request by hand.
 *
 * NOT exercised in this sandbox (no network access to api.replicate.com
 * here) — activate once FACE_SWAP_PROVIDER=replicate and FACE_SWAP_API_KEY
 * (a Replicate API token) are set. Runs as a post-processing step after the
 * main image provider generates a scene: it transplants the exact face from
 * the character's reference photo onto the generated image, which
 * guarantees identity match far more reliably than prompt-based reference
 * conditioning (see NanoBananaImageProvider) since it's a literal pixel
 * swap rather than a generative "keep this face in mind" instruction.
 */
export class ReplicateFaceSwapProvider implements FaceSwapProvider {
  readonly name = "replicate";

  async swap(referencePhotoPath: string, generatedImagePath: string): Promise<Buffer | null> {
    if (!config.generation.faceSwapApiKey) {
      throw new Error("FACE_SWAP_API_KEY is not set — cannot use the replicate face-swap provider");
    }

    // useFileOutput: false — return the output as a plain URL string
    // instead of a FileOutput stream wrapper, since this just needs to be
    // downloaded once as a Buffer.
    const replicate = new Replicate({ auth: config.generation.faceSwapApiKey, useFileOutput: false });

    const [swapImage, inputImage] = await Promise.all([toDataUri(referencePhotoPath), toDataUri(generatedImagePath)]);

    // cdingram/face-swap's schema: input_image is the target (base) photo,
    // swap_image is the face to transplant onto it.
    const output = await replicate.run(MODEL, { input: { input_image: inputImage, swap_image: swapImage } });
    const outputUrl = Array.isArray(output) ? output[0] : output;
    if (typeof outputUrl !== "string") {
      throw new Error(`Replicate prediction succeeded but returned an unexpected output shape: ${typeof outputUrl}`);
    }

    const response = await fetch(outputUrl);
    await assertOk(response, "Replicate face-swap output download");
    return Buffer.from(await response.arrayBuffer());
  }
}

async function toDataUri(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  return `data:${mimeType};base64,${data.toString("base64")}`;
}

const PIAPI_BASE_URL = "https://api.piapi.ai/api/v1";
const PIAPI_POLL_INTERVAL_MS = 3_000;
const PIAPI_MAX_POLL_ATTEMPTS = 40; // ~2 minutes

/**
 * Real provider wiring for PiAPI's Faceswap API
 * (https://piapi.ai/docs/faceswap-api/create-task), switched to after
 * ReplicateFaceSwapProvider hit a persistent, unresolved 422 in production
 * despite the model/version/token/billing all checking out independently.
 * Async task-based: POST creates a task, GET polls it by id.
 *
 * NOT exercised in this sandbox (no network access to api.piapi.ai here) —
 * activate once FACE_SWAP_PROVIDER=piapi and FACE_SWAP_API_KEY (a PiAPI
 * key) are set. The exact key name PiAPI uses inside a completed task's
 * `output` object for the result image URL was not confirmed against a
 * live response before shipping this (the interactive docs playground was
 * impractical to drive manually) — findOutputUrl() below checks several
 * plausible key names and throws a clear, loggable error listing the
 * actual output shape if none match, so this is diagnosable from
 * production logs on the first real run instead of guessing further.
 */
export class PiApiFaceSwapProvider implements FaceSwapProvider {
  readonly name = "piapi";

  async swap(referencePhotoPath: string, generatedImagePath: string): Promise<Buffer | null> {
    if (!config.generation.faceSwapApiKey) {
      throw new Error("FACE_SWAP_API_KEY is not set — cannot use the piapi face-swap provider");
    }

    const taskId = await this.submit(referencePhotoPath, generatedImagePath);
    const outputUrl = await this.pollUntilComplete(taskId);

    const response = await fetch(outputUrl);
    await assertOk(response, "PiAPI face-swap output download");
    return Buffer.from(await response.arrayBuffer());
  }

  private async submit(referencePhotoPath: string, generatedImagePath: string): Promise<string> {
    const [swapImage, targetImage] = await Promise.all([toDataUri(referencePhotoPath), toDataUri(generatedImagePath)]);

    const response = await fetch(`${PIAPI_BASE_URL}/task`, {
      method: "POST",
      headers: {
        "x-api-key": config.generation.faceSwapApiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qubico/image-toolkit",
        task_type: "face-swap",
        input: { target_image: targetImage, swap_image: swapImage },
      }),
    });

    await assertOk(response, "PiAPI");

    const json = (await response.json()) as PiApiTaskResponse;
    if (!json.data?.task_id) throw new Error("PiAPI task creation response did not include a task_id");
    return json.data.task_id;
  }

  private async pollUntilComplete(taskId: string): Promise<string> {
    for (let attempt = 0; attempt < PIAPI_MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(`${PIAPI_BASE_URL}/task/${taskId}`, {
        headers: { "x-api-key": config.generation.faceSwapApiKey! },
      });

      await assertOk(response, "PiAPI");

      const json = (await response.json()) as PiApiTaskResponse;
      const status = json.data?.status;
      if (status === "completed") {
        return findOutputUrl(json.data?.output);
      }
      if (status === "failed") {
        throw new Error(`PiAPI task failed: ${json.data?.error?.message || "unknown error"}`);
      }

      const isLastAttempt = attempt === PIAPI_MAX_POLL_ATTEMPTS - 1;
      if (!isLastAttempt) await sleep(PIAPI_POLL_INTERVAL_MS);
    }
    throw new Error(`PiAPI task ${taskId} did not complete within the polling window`);
  }
}

/** Checks the plausible key names PiAPI's other Qubico-family endpoints use
 * for a result image URL, since a live "completed" response wasn't
 * available to confirm the exact one for face-swap specifically. */
function findOutputUrl(output: Record<string, unknown> | undefined): string {
  const candidateKeys = ["image_url", "image", "url", "result_url", "output_url"];
  for (const key of candidateKeys) {
    const value = output?.[key];
    if (typeof value === "string" && value) return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  throw new Error(
    `PiAPI task completed but no known output URL field was found — actual output shape: ${JSON.stringify(output)}`
  );
}

interface PiApiTaskResponse {
  data?: {
    task_id?: string;
    status?: "completed" | "processing" | "pending" | "failed" | "staged";
    output?: Record<string, unknown>;
    error?: { message?: string };
  };
}
