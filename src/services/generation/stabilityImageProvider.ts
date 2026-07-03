import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { config } from "../../../config/index.js";
import { logger } from "../../utils/logger.js";
import type { GenerationRequest, GenerationResult, ImageGenerationProvider } from "./imageProvider.js";

const OUTPUT_ROOT = path.resolve(process.cwd(), "assets/images");

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

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Stability API error ${response.status}: ${detail}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const dir = path.join(OUTPUT_ROOT, req.characterId);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${req.assetId}.png`);
    await writeFile(filePath, Buffer.from(arrayBuffer));

    logger.info({ assetId: req.assetId, filePath }, "StabilityImageProvider: image generated");
    return { filePath, provider: this.name };
  }
}

function buildFormData(req: GenerationRequest): FormData {
  const form = new FormData();
  form.append("prompt", req.prompt);
  if (req.negativePrompt) form.append("negative_prompt", req.negativePrompt);
  form.append("output_format", "png");
  form.append("aspect_ratio", "2:3");
  return form;
}
