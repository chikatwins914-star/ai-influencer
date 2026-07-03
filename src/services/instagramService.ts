import { config } from "../../config/index.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../middleware/errorHandler.js";

// Check developers.facebook.com/docs for the current version — Meta ships a
// new one roughly every quarter. Last verified: v21.0 (2026-07).
const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

type IgMediaType = "IMAGE" | "REELS" | "STORIES";

/**
 * Thin wrapper around the Instagram Graph API (Content Publishing API).
 * Requires IG_ACCESS_TOKEN + IG_BUSINESS_ACCOUNT_ID in .env.
 *
 * Setup prerequisites (done on Meta's side, not in this codebase):
 *   1. Instagram account converted to Business or Creator
 *   2. Meta Developer App with the Instagram Graph API product added
 *   3. Permissions: instagram_business_basic + instagram_business_content_publish
 *      (add instagram_business_manage_comments if automating comment moderation)
 *   4. Meta App Review approval for production use beyond 25 test users
 *      (typically 2-4 weeks, requires a screencast of the full user flow)
 *   5. A long-lived access token (expires every 60 days — build a refresh flow)
 *
 * Known limits:
 *   - 100 published posts per rolling 24h window (all media types combined)
 *   - Media must already be hosted at a public URL; Graph API fetches it server-side
 *   - DMs are NOT accessible through this API — that requires the separate
 *     Instagram Messaging API + instagram_manage_messages permission, which
 *     is out of scope here. draftDmReply()/draftCommentReply() in
 *     shared/inboundMessageDrafts.ts intentionally only draft text for a
 *     human to send, not auto-send.
 *
 * Note: the source media (image/video) must already be reachable at a
 * public URL — the Graph API fetches it server-side. This system does not
 * host generated media itself; upload the generated asset to storage you
 * control (S3, Cloudflare R2, etc.) first, then pass that URL in.
 *
 * We intentionally do NOT use browser automation (Playwright) to log in
 * and post directly — that violates Instagram's Terms of Service and risks
 * account suspension. The Graph API is the only supported publishing path.
 */
function assertConfigured(): void {
  if (!config.instagram.isConfigured) {
    throw new AppError(
      "Instagram is not configured. Set IG_ACCESS_TOKEN and IG_BUSINESS_ACCOUNT_ID in .env before publishing.",
      412
    );
  }
}

async function graphFetch(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", config.instagram.accessToken ?? "");

  const res = await fetch(url.toString(), { method: "POST" });
  const body = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    logger.error({ status: res.status, body }, "Instagram Graph API error");
    throw new AppError(`Instagram API error: ${JSON.stringify(body)}`, 502);
  }
  return body;
}

/** Step 1: create a media container for an image, reel, or story. */
export async function createMediaContainer(params: {
  mediaUrl: string;
  caption?: string;
  mediaType: IgMediaType;
}): Promise<string> {
  assertConfigured();
  const igUserId = config.instagram.businessAccountId as string;

  const fieldForType = params.mediaType === "REELS" ? "video_url" : "image_url";
  const isVideo = params.mediaType === "REELS";

  const body = (await graphFetch(`/${igUserId}/media`, {
    [fieldForType]: params.mediaUrl,
    ...(params.caption ? { caption: params.caption } : {}),
    ...(params.mediaType !== "IMAGE" ? { media_type: params.mediaType } : {}),
    ...(isVideo ? { media_type: "REELS" } : {}),
  })) as { id?: string };

  if (!body.id) throw new AppError("Instagram did not return a container id", 502);
  return body.id;
}

/** Step 2: publish a previously created container. */
export async function publishMediaContainer(containerId: string): Promise<string> {
  assertConfigured();
  const igUserId = config.instagram.businessAccountId as string;

  const body = (await graphFetch(`/${igUserId}/media_publish`, {
    creation_id: containerId,
  })) as { id?: string };

  if (!body.id) throw new AppError("Instagram did not return a published media id", 502);
  return body.id;
}

/**
 * Convenience: create + publish in one call. Video containers (Reels) need
 * processing time on Meta's side in real usage — production code should
 * poll the container's status_code before publishing. This simplified
 * version publishes immediately, which works for images and often for
 * short reels, but add polling if you see "media not ready" errors.
 */
export async function publishToInstagram(params: {
  mediaUrl: string;
  caption?: string;
  mediaType: IgMediaType;
}): Promise<{ containerId: string; mediaId: string }> {
  const containerId = await createMediaContainer(params);
  const mediaId = await publishMediaContainer(containerId);
  logger.info({ containerId, mediaId, mediaType: params.mediaType }, "Published to Instagram");
  return { containerId, mediaId };
}
