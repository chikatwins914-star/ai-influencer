import type { UGCCategory } from "./types.js";

/**
 * UGC (User-Generated-Content style) product review scripts.
 * Structure: Hook → Problem/Context → Product Demo → Result → CTA.
 * {productName} and {brandName} are filled in per deal.
 *
 * Every UGC deliverable must carry the AI-disclosure text
 * (see shared/aiDisclosure.ts AI_DISCLOSURE.ugcDeliverable) in the
 * brand-facing document — this template covers on-screen/spoken content only.
 */
export interface UGCScriptTemplate {
  hook: string;
  problem: string;
  productDemo: string;
  result: string;
  cta: string;
}

export const UGC_SCRIPT_TEMPLATES: Record<UGCCategory, UGCScriptTemplate> = {
  SKINCARE: {
    hook: "okay I need to talk about {productName} because my skin has never looked better",
    problem: "between gym sweat and dorm dry air, my skin was breaking out constantly",
    productDemo: "close-up application shot, showing texture and how it absorbs, morning routine context",
    result: "before/after style comparison shot, glowing healthy skin close-up",
    cta: "linked in bio / use code for {brandName} — trust me, worth it",
  },
  SUPPLEMENT: {
    hook: "the {productName} routine that's actually helped my recovery between gym + tennis",
    problem: "training 5x a week left me sore and low energy",
    productDemo: "pouring/mixing shot, taking it as part of morning or post-workout routine",
    result: "post-workout energy shot, genuine satisfied reaction",
    cta: "check {brandName} out, link in bio",
  },
  SPORTS_EQUIPMENT: {
    hook: "testing {productName} for a week of gym sessions — honest review",
    problem: "old gear wasn't cutting it for intense training days",
    productDemo: "using the product mid-workout, close-up on key features",
    result: "genuine reaction after using it, comparison to before",
    cta: "get yours from {brandName}, link in bio",
  },
  TENNIS_EQUIPMENT: {
    hook: "trying {productName} on the court after 6 years of playing",
    problem: "looking for gear that actually keeps up with my game",
    productDemo: "on-court demo: serve, rally, footwork shots showing the product in use",
    result: "genuine reaction, improved comfort/performance comment",
    cta: "shop {brandName}, link in bio",
  },
  BEAUTY: {
    hook: "get ready with me using {productName} 💄",
    problem: "needed something quick but that still looks put-together for class",
    productDemo: "step-by-step application, close-up shots",
    result: "final look reveal, confident smile",
    cta: "all products from {brandName} linked in bio",
  },
  GADGET: {
    hook: "this {productName} has been a game changer for my content days",
    problem: "juggling school + content creation is a lot without the right tools",
    productDemo: "unboxing/setup shot, using it in a real content-creation context",
    result: "genuine reaction, specific feature highlight",
    cta: "get it from {brandName}, link in bio",
  },
  OTHER: {
    hook: "you guys asked me to review {productName} so here's my honest take",
    problem: "context-specific — customize based on the product category",
    productDemo: "clear demo shot of the product in a relevant daily-life context",
    result: "genuine reaction shot",
    cta: "check out {brandName}, link in bio",
  },
};

export function fillUgcTemplate(
  template: UGCScriptTemplate,
  vars: { productName: string; brandName: string }
): UGCScriptTemplate {
  const replace = (s: string) =>
    s.replace(/\{productName\}/g, vars.productName).replace(/\{brandName\}/g, vars.brandName);
  return {
    hook: replace(template.hook),
    problem: replace(template.problem),
    productDemo: replace(template.productDemo),
    result: replace(template.result),
    cta: replace(template.cta),
  };
}
