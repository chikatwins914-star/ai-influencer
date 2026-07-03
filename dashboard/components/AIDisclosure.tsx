"use client";

export const AIDisclosurePolicy = {
  shortTag: "#AI #DigitalCharacter",
  captionLine: "✨ AI-generated persona | Synthetic media",
  fanvueProfile:
    "This profile features an AI-generated persona. All images, videos, and messages are synthetic content, not a real person.",
  ugcDeliverable:
    "Deliverable produced using an AI-generated persona (synthetic media). This is disclosed to the brand and must be disclosed in any published placement per applicable advertising/endorsement guidelines (e.g., FTC guidance in the US).",
};

export function AIDisclosureHeader() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <p className="text-sm text-amber-800">
        <strong>⚠️ AI-Generated Persona System</strong>: This dashboard manages an AI-generated influencer profile.
        All content (images, videos, captions) must include the appropriate AI disclosure when posted to
        Instagram, Fanvue, or submitted as UGC.{" "}
        <a href="#ai-policy" className="underline font-semibold">
          Review disclosure policy
        </a>
      </p>
    </div>
  );
}

export function AIDisclosureTag() {
  return (
    <span className="inline-block bg-amber-100 text-amber-900 px-2 py-1 rounded text-xs font-semibold">
      {AIDisclosurePolicy.shortTag}
    </span>
  );
}

export function PostPreviewWithDisclosure({
  caption,
  mediaType,
}: {
  caption: string;
  mediaType: "IMAGE" | "VIDEO_REEL" | "STORY";
}) {
  const withDisclosure = `${caption}\n\n${AIDisclosurePolicy.captionLine} ${AIDisclosurePolicy.shortTag}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="bg-gray-100 aspect-square rounded flex items-center justify-center text-gray-500">
        <span className="text-sm">[{mediaType} Preview]</span>
      </div>
      <div className="space-y-2">
        <p className="text-sm whitespace-pre-wrap">{withDisclosure}</p>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-amber-700 font-semibold">
            ✓ AI disclosure tag automatically appended when posting
          </p>
        </div>
      </div>
    </div>
  );
}

export function FanvueDisclosureWarning() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-red-900 mb-2">Fanvue Profile Disclosure</h4>
      <p className="text-sm text-red-800 mb-3">{AIDisclosurePolicy.fanvueProfile}</p>
      <p className="text-xs text-red-700">
        <strong>Action required:</strong> Ensure this disclosure appears in your Fanvue profile bio/description before
        accepting any subscribers.
      </p>
    </div>
  );
}

export function UGCDisclosureChecklist() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-3">UGC Submission Checklist</h4>
      <ul className="space-y-2 text-sm text-blue-800">
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" disabled />
          <span>Brand informed that deliverable uses AI-generated persona</span>
        </li>
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" disabled />
          <span>AI disclosure included in deliverable file/document</span>
        </li>
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" disabled />
          <span>FTC/ASA compliance verified (if applicable to brand's jurisdiction)</span>
        </li>
      </ul>
      <p className="text-xs text-blue-700 mt-3">
        <a href="#ugc-template" className="underline">
          Use UGC disclosure template
        </a>
      </p>
    </div>
  );
}

export function InstagramPublishChecklist() {
  return (
    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 space-y-3">
      <h4 className="font-semibold text-pink-900">Before Publishing to Instagram</h4>
      <div className="space-y-2 text-sm text-pink-800">
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>Verified: AI disclosure tag ({AIDisclosurePolicy.shortTag}) is in caption</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>Enabled: Meta's "AI info" label on this post (when available)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>Confirmed: Prompt matches generated image (no accidental face swaps)</span>
        </label>
      </div>
    </div>
  );
}
