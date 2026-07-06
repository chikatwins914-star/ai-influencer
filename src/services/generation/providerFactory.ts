import { config } from "../../../config/index.js";
import { LocalStubImageProvider, type ImageGenerationProvider } from "./imageProvider.js";
import { LocalStubVideoProvider, type VideoGenerationProvider } from "./videoProvider.js";
import { StabilityImageProvider } from "./stabilityImageProvider.js";
import { NanoBananaImageProvider } from "./nanoBananaImageProvider.js";
import { SeedanceVideoProvider } from "./seedanceVideoProvider.js";
import { KlingVideoProvider } from "./klingVideoProvider.js";
import {
  NoopFaceSwapProvider,
  PiApiFaceSwapProvider,
  ReplicateFaceSwapProvider,
  type FaceSwapProvider,
} from "./faceSwapProvider.js";

/** Selects the image provider per IMAGE_GEN_PROVIDER — defaults to the offline stub. */
export function getImageProvider(): ImageGenerationProvider {
  switch (config.generation.imageProvider) {
    case "stability":
      return new StabilityImageProvider();
    case "nano-banana":
      return new NanoBananaImageProvider();
    case "local-stub":
      return new LocalStubImageProvider();
  }
}

/** Selects the video provider per VIDEO_GEN_PROVIDER — defaults to the offline stub. */
export function getVideoProvider(): VideoGenerationProvider {
  switch (config.generation.videoProvider) {
    case "seedance":
      return new SeedanceVideoProvider();
    case "kling":
      return new KlingVideoProvider();
    case "local-stub":
      return new LocalStubVideoProvider();
  }
}

/** Selects the face-swap post-processor per FACE_SWAP_PROVIDER — defaults to a noop. */
export function getFaceSwapProvider(): FaceSwapProvider {
  switch (config.generation.faceSwapProvider) {
    case "replicate":
      return new ReplicateFaceSwapProvider();
    case "piapi":
      return new PiApiFaceSwapProvider();
    case "none":
      return new NoopFaceSwapProvider();
  }
}
