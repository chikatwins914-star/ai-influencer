import { config } from "../../../config/index.js";
import { logger } from "../../utils/logger.js";
import type { GenerationRequest, GenerationResult, ImageGenerationProvider } from "./imageProvider.js";
import { IMAGES_ROOT, assertOk, persistGeneratedFile } from "./providerUtils.js";

const MODEL_ID = "gemini-3.1-flash-image-preview"; // Nano Banana 2

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": config.generation.imageGenApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPromptText(req) }] }],
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

function buildPromptText(req: GenerationRequest): string {
  return req.negativePrompt ? `${req.prompt}\n\nAvoid: ${req.negativePrompt}` : req.prompt;
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
