import { readFile } from "node:fs/promises";
import { config } from "../../../config/index.js";
import { logger } from "../../utils/logger.js";
import type { GenerationRequest, GenerationResult, ImageGenerationProvider } from "./imageProvider.js";
import { IMAGES_ROOT, assertOk, persistGeneratedFile } from "./providerUtils.js";

const MODEL_ID = "gemini-3.1-flash-image-preview"; // Nano Banana 2

// Only the first reference photo is sent — one is enough for Nano Banana's
// identity-consistency mode, and keeps request size/cost down.
const MAX_REFERENCE_IMAGES = 1;

/**
 * Real provider wiring for Google's Nano Banana 2 (Gemini 3.1 Flash Image)
 * via the Gemini API. NOT exercised in this sandbox (no network access here)
 * — this is the integration point to activate once IMAGE_GEN_PROVIDER=nano-banana
 * and IMAGE_GEN_API_KEY (a Gemini API key) are set in a real deployment with
 * network access. Confirm MODEL_ID against https://ai.google.dev/gemini-api/docs
 * at activation time in case the preview id has moved to a stable release name.
 */
export class NanoBananaImageProvider implements ImageGenerationProvider {
  readonly name = "nano-banana";

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    if (!config.generation.imageGenApiKey) {
      throw new Error("IMAGE_GEN_API_KEY is not set — cannot use the nano-banana provider");
    }

    const parts = await buildContentParts(req);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": config.generation.imageGenApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts }],
          // Gemini image models are multimodal and always return a text part
          // alongside the image — requesting IMAGE alone is rejected.
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    await assertOk(response, "Gemini API");

    const json = (await response.json()) as GeminiGenerateContentResponse;
    const inlineData = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!inlineData?.data) {
      throw new Error("Gemini API response did not include image data");
    }

    const ext = extensionForMimeType(inlineData.mimeType);
    const filePath = await persistGeneratedFile(
      IMAGES_ROOT,
      req.characterId,
      req.assetId,
      ext,
      Buffer.from(inlineData.data, "base64")
    );

    logger.info({ assetId: req.assetId, filePath, mimeType: inlineData.mimeType }, "NanoBananaImageProvider: image generated");
    return { filePath, provider: this.name };
  }
}

/** Builds the Gemini `contents[].parts` array: the character's reference
 * photo (if any) first, as inline image data, followed by the text prompt —
 * with the prompt itself reworded to point at the reference when present,
 * so the model keeps the same face/identity instead of inventing a new one
 * from the text description alone. */
async function buildContentParts(req: GenerationRequest): Promise<Array<Record<string, unknown>>> {
  const referencePaths = (req.referenceImagePaths ?? []).slice(0, MAX_REFERENCE_IMAGES);
  const parts: Array<Record<string, unknown>> = [];

  for (const refPath of referencePaths) {
    const data = await readFile(refPath);
    parts.push({ inlineData: { mimeType: mimeTypeForPath(refPath), data: data.toString("base64") } });
  }

  parts.push({ text: buildPromptText(req, referencePaths.length > 0) });
  return parts;
}

function mimeTypeForPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

function buildPromptText(req: GenerationRequest, hasReference: boolean): string {
  const base = req.negativePrompt ? `${req.prompt}\n\nAvoid: ${req.negativePrompt}` : req.prompt;
  if (!hasReference) return base;
  return (
    "Use the attached reference photo to keep this exact same person's face, identity, and appearance " +
    `consistent — do not invent a different face. Generate a new photorealistic image of this same person ` +
    `in the following scene: ${base}`
  );
}

/** Gemini image responses aren't format-constrained in the request, so the
 * actual returned mimeType decides the file extension rather than assuming PNG. */
function extensionForMimeType(mimeType: string | undefined): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
    default:
      return "png";
  }
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
    };
  }>;
}
