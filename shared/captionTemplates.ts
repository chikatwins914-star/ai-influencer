import type { ContentGenre } from "./types.js";

/**
 * Caption templates use {variable} placeholders. fillTemplate() below
 * does simple substitution. Keep templates short — the AI disclosure tag
 * is appended separately via shared/aiDisclosure.ts, not baked in here.
 */
export const CAPTION_TEMPLATES: Record<ContentGenre, string[]> = {
  GYM: [
    "leg day > everything else 🦵 {extra}",
    "no days off (okay, maybe one) 💪 {extra}",
  ],
  MORNING_ROUTINE: [
    "5am club, reporting for duty ☀️ {extra}",
    "small habits, big changes 🌱 {extra}",
  ],
  COFFEE: [
    "current mood: iced latte in hand ☕ {extra}",
    "coffee shop testing continues... {extra}",
  ],
  TENNIS: [
    "6 years on the court and still obsessed 🎾 {extra}",
    "serve. sweat. repeat. {extra}",
  ],
  BEACH: [
    "beach brain, no thoughts 🌊 {extra}",
    "vitamin sea 🐚 {extra}",
  ],
  MIRROR_SELFIE: [
    "rate the fit 1-10 👇 {extra}",
    "just a regular Tuesday fit check {extra}",
    "study break selfie because why not 📚 {extra}",
  ],
  HEALTHY_FOOD: [
    "what I eat to fuel my workouts 🥑 {extra}",
    "recipe in the comments if you want it! {extra}",
  ],
  TRAVEL: [
    "study abroad life = best decision I ever made ✈️ {extra}",
    "exploring on a student budget, one weekend at a time {extra}",
  ],
  CASUAL_DATE: [
    "dinner date energy 🍽️ {extra}",
  ],
  BEHIND_THE_SCENES: [
    "the not-so-glamorous side of content creation 😅 {extra}",
  ],
  ROOM_SELFIE: [
    "study break selfie because I earned it 📚✨ {extra}",
    "just a regular night in the dorm {extra}",
  ],
  LIBRARY_STUDY: [
    "library grind before the gym grind 📖💪 {extra}",
    "paying my own tuition so this library seat is basically my office now 😅 {extra}",
  ],
};

export function fillTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => variables[key] ?? "");
}

/** Standard DM reply templates for common inbound message types */
export const DM_REPLY_TEMPLATES: Record<string, string> = {
  compliment: "aww thank you so much 🥹 that means a lot!",
  workoutQuestion: "great question! I'll probably do a full video on this soon — stay tuned 👀",
  collabInquiry:
    "thanks so much for reaching out! For collab/partnership inquiries please email {contactEmail} 🙏",
  spam: "", // no reply — flag for manual review instead
};

/** Comment reply templates (short, casual) */
export const COMMENT_REPLY_TEMPLATES: string[] = [
  "thank you!! 🥹",
  "haha thank you so much 😊",
  "you're so sweet, thank you!",
  "appreciate you! 🙏",
];
