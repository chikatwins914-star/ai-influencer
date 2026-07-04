import { config } from "../../../config/index.js";
import { LocalStubImageProvider, type ImageGenerationProvider } from "./imageProvider.js";
import { LocalStubVideoProvider, type VideoGenerationProvider } from "./videoProvider.js";
import { StabilityImageProvider } from "./stabilityImageProvider.js";
import { NanoBananaImageProvider } from "./nanoBananaImageProvider.js";
import { SeedanceVideoProvider } from "./seedanceVideoProvider.js";

/** Selects the image provider per IMAGE_GEN_PROVIDER — defaults to the offline stub. */
export function getImageProvider(): ImageGenerationProvider {
  switch (config.generation.imageProvider) {
    case "stability":
      return new StabilityImageProvider();
    case "nano-banana":
      return new NanoBananaImageProvider();
    case "openai":
      throw new Error("IMAGE_GEN_PROVIDER=openai has no provider implementation yet");
    case "local-stub":
      return new LocalStubImageProvider();
  }
}

/** Selects the video provider per VIDEO_GEN_PROVIDER — defaults to the offline stub. */
export function getVideoProvider(): VideoGenerationProvider {
  switch (config.generation.videoProvider) {
    case "seedance":
      return new SeedanceVideoProvider();
    case "runway":
      throw new Error("VIDEO_GEN_PROVIDER=runway has no provider implementation yet");
    case "local-stub":
      return new LocalStubVideoProvider();
  }
}
