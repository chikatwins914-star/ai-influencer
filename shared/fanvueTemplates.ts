/**
 * Fanvue message templates (per MessageTemplateCategory in schema.prisma)
 * and Instagram→Fanvue funnel copy. Fanvue has no public creator API as of
 * this writing, so these are drafted for manual sending/posting — see
 * src/services/fanvueService.ts.
 */

export interface FanvueMessageTemplateSeed {
  category: "WELCOME" | "PROMO" | "RENEWAL_REMINDER" | "THANK_YOU" | "PPV_OFFER";
  template: string;
  variables: string[];
}

export const FANVUE_MESSAGE_TEMPLATES: FanvueMessageTemplateSeed[] = [
  {
    category: "WELCOME",
    template:
      "hey {firstName}! 🥰 thank you so much for subscribing, welcome in! this is where I post the stuff " +
      "I don't put on Instagram — behind the scenes, extra gym/beach content, and more of my day to day. " +
      "let me know if you have any questions!",
    variables: ["firstName"],
  },
  {
    category: "PROMO",
    template:
      "hey! 👀 just dropped a new set — {contentDescription}. it's up now, don't miss it 🔥",
    variables: ["contentDescription"],
  },
  {
    category: "RENEWAL_REMINDER",
    template:
      "hey {firstName}, your subscription is renewing soon! thank you for sticking around 🥹 more content " +
      "coming this week, you won't want to miss it",
    variables: ["firstName"],
  },
  {
    category: "THANK_YOU",
    template: "thank you so much for the support {firstName} 🥹💗 seriously means a lot!",
    variables: ["firstName"],
  },
  {
    category: "PPV_OFFER",
    template:
      "hey {firstName} 👀 I have something special I think you'd like — {contentDescription}. want me to send it over? {price}",
    variables: ["firstName", "contentDescription", "price"],
  },
];

/**
 * Instagram bio / caption / story copy used to drive traffic to Fanvue.
 * {profileUrl} is filled from config.fanvue.profileUrl.
 */
export const IG_TO_FANVUE_CTA_TEMPLATES: string[] = [
  "the content I can't post here lives on Fanvue 👀 link in bio",
  "more of this (and then some) on my Fanvue — link in bio 🔗",
  "wanna see what didn't make the cut for Instagram? Fanvue, link in bio 😉",
];

export function fillFanvueTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => vars[key] ?? "");
}
