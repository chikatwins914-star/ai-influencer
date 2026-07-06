import { config } from "../../../config/index.js";
import { logger } from "../../utils/logger.js";
import type { GenerationRequest, GenerationResult, ImageGenerationProvider } from "./imageProvider.js";
import { IMAGES_ROOT, assertOk, persistGeneratedFile } from "./providerUtils.js";

/**
 * Real provider wiring for Stability AI's image generation REST API.
 * NOT exercised in this sandbox (no network access here) — this is the
 * integration point to activate once IMAGE_GEN_PROVIDER=stability and
 * IMAGE_GEN_API_KEY are set in a real deployment with network access.
 */
export class StabilityImageProvider implements ImageGenerationProvider {
  readonly name = "stability";

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    if (!config.generation.imageGenApiKey) {
      throw new Error("IMAGE_GEN_API_KEY is not set — cannot use the stability provider");
    }

    const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.generation.imageGenApiKey}`,
        Accept: "image/*",
      },
      body: buildFormData(req),
    });

    await assertOk(response, "Stability API");

    const arrayBuffer = await response.arrayBuffer();
    const filePath = await persistGeneratedFile(
      IMAGES_ROOT,
      req.characterId,
      req.assetId,
      "png",
      Buffer.from(arrayBuffer)
    );

    logger.info({ assetId: req.assetId, filePath }, "StabilityImageProvider: image generated");
    return { filePath, provider: this.name };
  }
}

function buildFormData(req: GenerationRequest): FormData {
  const form = new FormData();
  form.append("prompt", req.prompt);
  if (req.negativePrompt) form.append("negative_prompt", req.negativePrompt);
  form.append("output_format", "png");
  // 9:16 matches Instagram Reels/Stories and TikTok's vertical format.
  form.append("aspect_ratio", "9:16");
  return form;
}
