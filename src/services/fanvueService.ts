import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { config } from "../../config/index.js";
import { AI_DISCLOSURE } from "../../shared/aiDisclosure.js";
import {
  FANVUE_MESSAGE_TEMPLATES,
  IG_TO_FANVUE_CTA_TEMPLATES,
  fillFanvueTemplate,
} from "../../shared/fanvueTemplates.js";

/**
 * Seeds the standard Fanvue message templates (idempotent — skips categories
 * that already have a template so manual edits aren't clobbered on re-run).
 */
export async function seedFanvueMessageTemplates() {
  const existingCategories = new Set(
    (await prisma.fanvueMessage.findMany({ select: { category: true } })).map((m) => m.category)
  );

  const created: string[] = [];
  for (const seed of FANVUE_MESSAGE_TEMPLATES) {
    if (existingCategories.has(seed.category)) continue;
    await prisma.fanvueMessage.create({
      data: {
        category: seed.category,
        template: seed.template,
        variables: JSON.stringify(seed.variables),
      },
    });
    created.push(seed.category);
  }

  logger.info({ created }, "Fanvue message templates seeded");
  return { created };
}

export interface CreateFanvuePostInput {
  title: string;
  description: string;
  price?: number;
  scheduledFor?: Date;
}

/** Creates a Fanvue post draft. Always carries the AI-disclosure text — see shared/aiDisclosure.ts. */
export async function createFanvuePost(input: CreateFanvuePostInput) {
  const post = await prisma.fanvuePost.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price ?? null,
      scheduledFor: input.scheduledFor ?? null,
      status: input.scheduledFor ? "SCHEDULED" : "DRAFT",
      aiDisclosureText: AI_DISCLOSURE.fanvueProfile,
    },
  });
  logger.info({ postId: post.id }, "Fanvue post draft created");
  return post;
}

/** Fills a Fanvue message template by category with the given variables. */
export async function draftFanvueMessage(
  category: "WELCOME" | "PROMO" | "RENEWAL_REMINDER" | "THANK_YOU" | "PPV_OFFER",
  vars: Record<string, string>
): Promise<{ text: string } | null> {
  const template = await prisma.fanvueMessage.findFirst({ where: { category } });
  if (!template) return null;
  return { text: fillFanvueTemplate(template.template, vars) };
}

/**
 * Returns Instagram-side copy for driving traffic to Fanvue (bio line,
 * caption CTA, story prompt) with the configured profile URL filled in.
 * This is Instagram-facing content that references the Fanvue destination —
 * Fanvue's own post/profile disclosure is handled separately in createFanvuePost.
 */
export function getInstagramToFanvueFunnelCopy(seedKey: string): {
  captionCta: string;
  bioLine: string;
  profileUrl: string;
} {
  const index = Math.abs(hashCode(seedKey)) % IG_TO_FANVUE_CTA_TEMPLATES.length;
  const template = IG_TO_FANVUE_CTA_TEMPLATES[index] ?? IG_TO_FANVUE_CTA_TEMPLATES[0]!;
  return {
    captionCta: template,
    bioLine: `exclusive content 👉 ${config.fanvue.profileUrl}`,
    profileUrl: config.fanvue.profileUrl,
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
