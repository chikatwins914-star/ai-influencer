import path from "node:path";
import { logger } from "../../utils/logger.js";
import { persistGeneratedFile } from "./providerUtils.js";

export interface GenerationRequest {
  assetId: string;
  characterId: string;
  prompt: string;
  negativePrompt?: string | null;
}

export interface GenerationResult {
  filePath: string;
  provider: string;
}

export interface ImageGenerationProvider {
  readonly name: string;
  generate(req: GenerationRequest): Promise<GenerationResult>;
}

const OUTPUT_ROOT = path.resolve(process.cwd(), "assets/images");

/**
 * Offline/dev provider — does not call any external API (works with no
 * network access). Produces a real, openable SVG placeholder file that
 * embeds the prompt text, so the full pipeline (DB status transitions,
 * file paths, dashboard preview) can be exercised end-to-end before a
 * real image-generation API key is wired in.
 *
 * Swap IMAGE_GEN_PROVIDER to "stability" or "nano-banana" (see
 * StabilityImageProvider / NanoBananaImageProvider) once you have network
 * access + an API key.
 */
export class LocalStubImageProvider implements ImageGenerationProvider {
  readonly name = "local-stub";

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const svg = renderPlaceholderSvg(req.prompt);
    const filePath = await persistGeneratedFile(OUTPUT_ROOT, req.characterId, req.assetId, "svg", svg);

    logger.info({ assetId: req.assetId, filePath }, "LocalStubImageProvider: placeholder generated");
    return { filePath, provider: this.name };
  }
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function renderPlaceholderSvg(prompt: string): string {
  const lines = wrapText(prompt, 60).slice(0, 20);
  const tspans = lines
    .map((line, i) => `<tspan x="40" dy="${i === 0 ? 0 : 22}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <rect width="1024" height="1536" fill="#FFE5EC"/>
  <rect x="20" y="20" width="984" height="1496" fill="none" stroke="#FF4D6D" stroke-width="4" stroke-dasharray="10,8"/>
  <text x="40" y="60" font-family="sans-serif" font-size="28" fill="#FF4D6D" font-weight="bold">PLACEHOLDER — local-stub provider</text>
  <text x="40" y="100" font-family="monospace" font-size="16" fill="#333">${tspans}</text>
</svg>`;
}
