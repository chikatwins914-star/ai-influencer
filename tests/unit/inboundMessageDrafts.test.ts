import { describe, expect, it } from "vitest";
import { classifyInboundMessage, draftCommentReply, draftDmReply } from "../../shared/inboundMessageDrafts.js";

describe("inbound message classification", () => {
  it("classifies compliments", () => {
    expect(classifyInboundMessage("omg you're gorgeous!!")).toBe("compliment");
  });

  it("classifies workout questions", () => {
    expect(classifyInboundMessage("what's your workout routine like?")).toBe("workoutQuestion");
  });

  it("classifies collab inquiries", () => {
    expect(classifyInboundMessage("Hi! We'd love a sponsor / partnership with you")).toBe("collabInquiry");
  });

  it("flags spam/links for manual review instead of auto-replying", () => {
    const result = draftCommentReply("check this out https://free-followers-now.com");
    expect(result.requiresManualReview).toBe(true);
    expect(result.suggestedReply).toBeNull();
  });

  it("flags ambiguous messages for manual review rather than guessing", () => {
    const result = draftDmReply("hey");
    expect(result.requiresManualReview).toBe(true);
  });

  it("fills in the contact email for collab DM replies", () => {
    const result = draftDmReply("interested in a brand partnership", "business@example.com");
    expect(result.suggestedReply).toContain("business@example.com");
  });
});
