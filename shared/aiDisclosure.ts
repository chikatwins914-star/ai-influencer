/**
 * Centralized AI-disclosure text and helpers.
 *
 * Every piece of published content (IG posts/reels/stories, Fanvue posts,
 * UGC deliverables) must carry a disclosure that the persona is AI-generated.
 * This keeps the requirement in one place instead of scattered across
 * content-generation call sites, so policy changes only need one edit.
 */

export const AI_DISCLOSURE = {
  /** Short tag suitable for appending to captions / hashtag blocks */
  shortTag: "#AI #DigitalCharacter",

  /** One-line disclosure for bios / post captions */
  captionLine: "✨ AI-generated persona | Synthetic media",

  /** Longer disclosure for Fanvue profile / bio */
  fanvueProfile:
    "This profile features an AI-generated persona. All images, videos, and messages are synthetic content, not a real person.",

  /** Disclosure text to include in every UGC deliverable + brand-facing docs */
  ugcDeliverable:
    "Deliverable produced using an AI-generated persona (synthetic media). This is disclosed to the brand and must be disclosed in any published placement per applicable advertising/endorsement guidelines (e.g., FTC guidance in the US).",

  /** Instagram in-app AI label guidance (platform-level, not text we control) */
  instagramNote:
    "In addition to caption disclosure, enable Meta's built-in 'AI info' / synthetic media label on every post where the platform supports it.",
} as const;

/**
 * Appends the standard short disclosure tag to a caption if not already present.
 */
export function withDisclosureTag(caption: string): string {
  if (caption.includes(AI_DISCLOSURE.shortTag)) return caption;
  return `${caption}\n\n${AI_DISCLOSURE.captionLine} ${AI_DISCLOSURE.shortTag}`;
}
