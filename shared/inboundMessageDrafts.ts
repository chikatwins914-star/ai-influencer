import { DM_REPLY_TEMPLATES, COMMENT_REPLY_TEMPLATES } from "./captionTemplates.js";

/**
 * Lightweight keyword-based classifier for inbound comments/DMs.
 * This is intentionally simple (no ML/LLM call) — it produces a *draft*
 * reply for human review, not an auto-send. Any ambiguous or hostile
 * message should be flagged for manual handling rather than auto-replied.
 */
export type InboundMessageCategory =
  | "compliment"
  | "workoutQuestion"
  | "collabInquiry"
  | "spam"
  | "needsManualReview";

const KEYWORD_RULES: Array<{ category: InboundMessageCategory; keywords: string[] }> = [
  { category: "collabInquiry", keywords: ["collab", "partnership", "sponsor", "brand deal", "ambassador"] },
  { category: "workoutQuestion", keywords: ["workout", "routine", "how do you", "reps", "sets", "diet", "training"] },
  { category: "compliment", keywords: ["beautiful", "gorgeous", "love this", "stunning", "amazing", "so pretty"] },
  { category: "spam", keywords: ["http://", "https://", "click here", "free followers", "crypto", "investment"] },
];

export function classifyInboundMessage(text: string): InboundMessageCategory {
  const lower = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.category;
  }
  return "needsManualReview";
}

export interface ReplyDraft {
  category: InboundMessageCategory;
  suggestedReply: string | null; // null => no safe auto-draft, flag for manual review
  requiresManualReview: boolean;
}

export function draftCommentReply(commentText: string): ReplyDraft {
  const category = classifyInboundMessage(commentText);

  if (category === "spam" || category === "needsManualReview") {
    return { category, suggestedReply: null, requiresManualReview: true };
  }

  const index = Math.abs(hashCode(commentText)) % COMMENT_REPLY_TEMPLATES.length;
  return {
    category,
    suggestedReply: COMMENT_REPLY_TEMPLATES[index] ?? COMMENT_REPLY_TEMPLATES[0] ?? null,
    requiresManualReview: false,
  };
}

export function draftDmReply(messageText: string, contactEmail?: string): ReplyDraft {
  const category = classifyInboundMessage(messageText);

  if (category === "spam" || category === "needsManualReview") {
    return { category, suggestedReply: null, requiresManualReview: true };
  }

  const template = DM_REPLY_TEMPLATES[category] ?? "";
  const filled = template.replace("{contactEmail}", contactEmail ?? "[set FANVUE/business email in config]");

  return { category, suggestedReply: filled || null, requiresManualReview: !filled };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
