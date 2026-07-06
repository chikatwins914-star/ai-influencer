import { UGC_SCRIPT_TEMPLATES, fillUgcTemplate } from "../../shared/ugcTemplates.js";
import type { UGCCategory } from "../../shared/types.js";

/** Builds a full UGC deliverable script (hook/problem/demo/result/cta) from
 * the category template, filled in with this deal's brand/product names. */
export function generateUgcScript(category: UGCCategory, productName: string, brandName: string): string {
  const template = UGC_SCRIPT_TEMPLATES[category];
  const filled = fillUgcTemplate(template, { productName, brandName });
  return [
    `Hook: ${filled.hook}`,
    `Problem: ${filled.problem}`,
    `Product Demo: ${filled.productDemo}`,
    `Result: ${filled.result}`,
    `CTA: ${filled.cta}`,
  ].join("\n\n");
}
