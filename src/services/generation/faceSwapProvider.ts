import { readFile } from "node:fs/promises";
import Replicate from "replicate";
import { config } from "../../../config/index.js";
import { assertOk } from "./providerUtils.js";

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
