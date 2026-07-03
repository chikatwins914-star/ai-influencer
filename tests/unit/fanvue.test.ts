import { describe, expect, it } from "vitest";
import { FANVUE_MESSAGE_TEMPLATES, fillFanvueTemplate, IG_TO_FANVUE_CTA_TEMPLATES } from "../../shared/fanvueTemplates.js";
import { AI_DISCLOSURE } from "../../shared/aiDisclosure.js";

describe("Fanvue message templates", () => {
  it("covers all five message categories", () => {
    const categories = FANVUE_MESSAGE_TEMPLATES.map((t) => t.category).sort();
    expect(categories).toEqual(["PPV_OFFER", "PROMO", "RENEWAL_REMINDER", "THANK_YOU", "WELCOME"].sort());
  });

  it("fills variables into a template", () => {
    const welcome = FANVUE_MESSAGE_TEMPLATES.find((t) => t.category === "WELCOME")!;
    const filled = fillFanvueTemplate(welcome.template, { firstName: "Alex" });
    expect(filled).toContain("Alex");
    expect(filled).not.toContain("{firstName}");
  });

  it("leaves unrecognized placeholders blank rather than throwing", () => {
    const filled = fillFanvueTemplate("hi {firstName}, re: {unknownVar}", { firstName: "Sam" });
    expect(filled).toBe("hi Sam, re: ");
  });
});

describe("Instagram to Fanvue funnel copy", () => {
  it("has at least one CTA template", () => {
    expect(IG_TO_FANVUE_CTA_TEMPLATES.length).toBeGreaterThan(0);
  });
});

describe("AI disclosure on Fanvue", () => {
  it("has a dedicated Fanvue profile disclosure string", () => {
    expect(AI_DISCLOSURE.fanvueProfile.toLowerCase()).toContain("ai-generated");
  });
});
