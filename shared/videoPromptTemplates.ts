import type { ContentGenre, VideoStructure } from "./types.js";

/**
 * Video structure templates (15–30s Reels). Each genre has 1+ template;
 * {variant} placeholders get filled from the same SceneVariant pool used
 * for images, so a reel's visuals stay consistent with that day's image set.
 */
export const VIDEO_TEMPLATES: Record<ContentGenre, VideoStructure[]> = {
  GYM: [
    {
      hook: "POV: leg day but make it aesthetic (0-3s, quick cuts of warm-up)",
      body: "3-4 quick clips: set-up, mid-rep close-up, form check, water break — upbeat trending audio",
      ending: "Post-workout glow shot, satisfied smile, towel over shoulder",
      cta: "Comment your favorite leg day exercise 👇 Save this for your next gym session",
    },
  ],
  MORNING_ROUTINE: [
    {
      hook: "5am productive morning routine as a student athlete (text overlay: '5AM ROUTINE')",
      body: "Quick cuts: alarm off, stretching, smoothie prep, skincare, outfit pick — fast-paced transitions",
      ending: "Walking out the door with coffee, confident smile at camera",
      cta: "Which step should I do a full video on? Comment below!",
    },
  ],
  COFFEE: [
    {
      hook: "Rating Canadian coffee shops near campus as an international student ☕",
      body: "Ordering, latte art close-up, first sip reaction, cozy cafe ambiance shots",
      ending: "Rating card overlay (e.g. 8.5/10), genuine satisfied reaction",
      cta: "What's your go-to coffee order? Drop it in the comments!",
    },
  ],
  TENNIS: [
    {
      hook: "Tennis practice after 6 years of playing — POV first serve of the day",
      body: "Serve slow-mo, rally close-up, footwork drill, bench water break",
      ending: "Successful winning shot celebration, genuine excited smile",
      cta: "Tag a friend who needs to get back on the court!",
    },
  ],
  BEACH: [
    {
      hook: "Beach day reset after finals week 🌊 (text overlay: 'finally free')",
      body: "Walking shoreline, playing in waves, candid laugh with hair in wind, sunset transition",
      ending: "Sitting on the sand watching the sunset, peaceful smile",
      cta: "Where should I go for my next beach trip? Comment your suggestions!",
    },
  ],
  MIRROR_SELFIE: [
    {
      hook: "Outfit check before heading to class (text overlay: 'rate this fit 1-10')",
      body: "Mirror selfie turn, close-up of accessories, quick outfit change transition",
      ending: "Final pose, confident smile, thumbs up",
      cta: "Rate the fit 1-10 in the comments!",
    },
  ],
  HEALTHY_FOOD: [
    {
      hook: "What I eat in a day as a busy international student 🥑",
      body: "Breakfast smoothie bowl, lunch prep, healthy snack, quick recipe tip text overlay",
      ending: "Final plated meal shot, satisfied first bite",
      cta: "Want the full recipe? Comment 'RECIPE' and I'll post it!",
    },
  ],
  TRAVEL: [
    {
      hook: "Study abroad diaries: exploring Canada on a student budget ✈️",
      body: "Scenic transition shots, candid walking clips, budget tip text overlays",
      ending: "Sunset/viewpoint shot, reflective smile at camera",
      cta: "Follow for more study abroad content — next stop revealed soon!",
    },
  ],
  CASUAL_DATE: [
    {
      hook: "Get ready with me for a casual dinner date 🍽️ (light, PG-rated vlog style)",
      body: "Outfit prep, quick makeup touch-up, walking to the restaurant, candid laugh",
      ending: "Seated at the table, genuine smile toward camera",
      cta: "What should I order? Comment your guess!",
    },
  ],
  BEHIND_THE_SCENES: [
    {
      hook: "What actually goes into a content day (text overlay: 'BTS')",
      body: "Setting up ring light, outfit changes, bloopers/funny outtakes, snack break",
      ending: "Laughing at a blooper clip, relaxed candid smile",
      cta: "Follow for more behind-the-scenes content!",
    },
  ],
  ROOM_SELFIE: [
    {
      hook: "study break selfie check-in (text overlay: 'productive? kinda')",
      body: "Quick candid clips: stretching on the bed, messy desk pan, playful selfie faces",
      ending: "Cozy close-up selfie, relaxed genuine smile",
      cta: "What are you up to tonight? Tell me below!",
    },
  ],
  LIBRARY_STUDY: [
    {
      hook: "a realistic study day at the library as an international student (text overlay: 'STUDY VLOG')",
      body: "Quick cuts: walking into the library, note-taking close-up, coffee break, tired stretch",
      ending: "Packing up laptop, relieved smile walking out of the library",
      cta: "Comment your best study tips — I need them 😅",
    },
  ],
  MOTIVATION: [
    {
      hook: "Bold white-on-black text overlay hits on beat: 'NOBODY IS COMING TO SAVE YOU.' — cut to sunrise gym, slow-motion",
      body: "Cinematic training montage: heavy breathing close-up, weight slamming down, sprint on an empty track, journal page with a goal underlined — deep, calm voiceover-style captions building line by line: 'Discipline is a decision you make before you feel like it. / Get up. / Show up. / Do it again tomorrow.'",
      ending: "Slow push-in on her face, steady eye contact with the camera, no smile — just quiet resolve, final text overlay: 'YOUR EXCUSES EXPIRE TODAY.'",
      cta: "Save this for the morning you don't want to get up. Follow for daily motivation.",
    },
    {
      hook: "Text overlay punches in: 'IF YOU'RE TIRED OF STARTING OVER, STOP QUITTING.' — cut to pre-dawn run, breath visible in cold air",
      body: "Fast, rhythmic cuts timed to a swelling instrumental: lacing up shoes in the dark, first hard step outside, mid-run struggle face, gritted-teeth push up a hill — captions land one at a time: 'Motivation is temporary. / Discipline outlasts it. / The version of you that gives up here never becomes the version who wins.'",
      ending: "Reaching the top of the hill as the sun breaks the horizon, hands raised, controlled exhale, not a big celebration — earned, quiet",
      cta: "Tag someone who needs to see this today. Save it for your hardest day.",
    },
    {
      hook: "Direct-to-camera cold open, no music yet: 'Nobody talks about the version of you that has to show up when it's hard.' — text overlay: 'WATCH THIS IF YOU WANT TO QUIT'",
      body: "Cuts between direct-to-camera speech fragments and B-roll of solo training (deadlift setup, journaling by lamp light, alarm clock at 5am) — voiceover-style captions: 'You don't need more motivation. / You need a shorter list of excuses. / Do the work today that your future self is depending on.' — music builds under the last two lines",
      ending: "Final direct-to-camera line, steady and calm: 'So get up. Let's go.' — hard cut to black",
      cta: "Comment 'I'M IN' if you're starting today. Follow for more.",
    },
  ],
};

export function getVideoTemplate(genre: ContentGenre, index = 0): VideoStructure {
  const templates = VIDEO_TEMPLATES[genre];
  const template = templates[index % templates.length];
  if (!template) throw new Error(`No video template configured for genre ${genre}`);
  return template;
}
