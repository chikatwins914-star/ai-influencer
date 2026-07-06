import { readFile } from "node:fs/promises";
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

const REPLICATE_BASE_URL = "https://api.replicate.com/v1";
// https://replicate.com/cdingram/face-swap/api (HTTP tab) — this is the
// exact request shape Replicate's own docs show for this model: flat
// /v1/predictions with the version hash in the body. Re-check
// https://replicate.com/cdingram/face-swap/versions if this ever needs
// bumping to a newer published version.
const MODEL_VERSION = "d1d6ea8c8be89d664a07a457526f7128109dee7030fdea7cddca9968ffe38b8";
const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

/**
 * Real provider wiring for a Replicate-hosted face-swap model
 * (https://replicate.com). NOT exercised in this sandbox (no network access
 * to api.replicate.com here) — activate once FACE_SWAP_PROVIDER=replicate
 * and FACE_SWAP_API_KEY (a Replicate API token) are set. Runs as a
 * post-processing step after the main image provider generates a scene: it
 * transplants the exact face from the character's reference photo onto the
 * generated image, which guarantees identity match far more reliably than
 * prompt-based reference conditioning (see NanoBananaImageProvider) since
 * it's a literal pixel swap rather than a generative "keep this face in
 * mind" instruction.
 */
export class ReplicateFaceSwapProvider implements FaceSwapProvider {
  readonly name = "replicate";

  async swap(referencePhotoPath: string, generatedImagePath: string): Promise<Buffer | null> {
    if (!config.generation.faceSwapApiKey) {
      throw new Error("FACE_SWAP_API_KEY is not set — cannot use the replicate face-swap provider");
    }

    const predictionId = await this.submit(referencePhotoPath, generatedImagePath);
    const outputUrl = await this.pollUntilComplete(predictionId);

    const response = await fetch(outputUrl);
    await assertOk(response, "Replicate face-swap output download");
    return Buffer.from(await response.arrayBuffer());
  }

  private async submit(referencePhotoPath: string, generatedImagePath: string): Promise<string> {
    const [swapImage, inputImage] = await Promise.all([toDataUri(referencePhotoPath), toDataUri(generatedImagePath)]);

    // cdingram/face-swap's schema: input_image is the target (base) photo,
    // swap_image is the face to transplant onto it.
    const response = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.generation.faceSwapApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: MODEL_VERSION,
        input: { input_image: inputImage, swap_image: swapImage },
      }),
    });

    await assertOk(response, "Replicate API");

    const json = (await response.json()) as ReplicatePrediction;
    if (!json.id) throw new Error("Replicate prediction response did not include an id");
    return json.id;
  }

  private async pollUntilComplete(predictionId: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, {
        headers: { Authorization: `Bearer ${config.generation.faceSwapApiKey}` },
      });

      await assertOk(response, "Replicate API");

      const json = (await response.json()) as ReplicatePrediction;
      if (json.status === "succeeded") {
        const output = Array.isArray(json.output) ? json.output[0] : json.output;
        if (!output) throw new Error("Replicate prediction succeeded but returned no output");
        return output;
      }
      if (json.status === "failed" || json.status === "canceled") {
        throw new Error(`Replicate prediction ${json.status}: ${json.error ?? "unknown error"}`);
      }

      const isLastAttempt = attempt === MAX_POLL_ATTEMPTS - 1;
      if (!isLastAttempt) await sleep(POLL_INTERVAL_MS);
    }
    throw new Error(`Replicate prediction ${predictionId} did not complete within the polling window`);
  }
}

async function toDataUri(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  return `data:${mimeType};base64,${data.toString("base64")}`;
}

interface ReplicatePrediction {
  id?: string;
  status?: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
}
