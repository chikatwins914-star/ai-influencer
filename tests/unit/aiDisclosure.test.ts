import { describe, expect, it } from "vitest";
import { AI_DISCLOSURE, withDisclosureTag } from "../../shared/aiDisclosure.js";

describe("AI disclosure helpers", () => {
  it("appends the disclosure tag to a caption that does not have it", () => {
    const result = withDisclosureTag("Morning workout done 💪");
    expect(result).toContain(AI_DISCLOSURE.shortTag);
    expect(result).toContain(AI_DISCLOSURE.captionLine);
  });

  it("does not duplicate the disclosure tag if already present", () => {
    const already = `Morning workout done 💪\n\n${AI_DISCLOSURE.captionLine} ${AI_DISCLOSURE.shortTag}`;
    const result = withDisclosureTag(already);
    const occurrences = result.split(AI_DISCLOSURE.shortTag).length - 1;
    expect(occurrences).toBe(1);
  });
});
