import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { config } from "../../../config/index.js";
import { logger } from "../../utils/logger.js";
import type { GenerationRequest, GenerationResult, ImageGenerationProvider } from "./imageProvider.js";

const OUTPUT_ROOT = path.resolve(process.cwd(), "assets/images");
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

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Gemini API error ${response.status}: ${detail}`);
    }

    const json = (await response.json()) as GeminiGenerateContentResponse;
    const inlineData = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!inlineData?.data) {
      throw new Error("Gemini API response did not include image data");
    }

    const dir = path.join(OUTPUT_ROOT, req.characterId);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${req.assetId}.png`);
    await writeFile(filePath, Buffer.from(inlineData.data, "base64"));

    logger.info({ assetId: req.assetId, filePath }, "NanoBananaImageProvider: image generated");
    return { filePath, provider: this.name };
  }
}

function buildPromptText(req: GenerationRequest): string {
  return req.negativePrompt ? `${req.prompt}\n\nAvoid: ${req.negativePrompt}` : req.prompt;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
    };
  }>;
}
