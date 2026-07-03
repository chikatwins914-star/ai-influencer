import type { ContentGenre } from "./types.js";

/**
 * Variable pools per genre. Prompt generation rotates through these so that
 * daily output (20 images / 3 reels / 5 stories) has visual variety while
 * the character's identity (face/body/hair — see characterSchema-derived
 * base prompt) stays fixed.
 */
export interface SceneVariant {
  location: string;
  outfit: string;
  action: string;
  lighting: string;
  cameraFraming: string;
}

export const GENRE_VARIANTS: Record<ContentGenre, SceneVariant[]> = {
  GYM: [
    {
      location: "modern gym with floor-to-ceiling windows",
      outfit: "matching coral pink sports bra and leggings set",
      action: "mid-rep dumbbell shoulder press, focused expression",
      lighting: "bright natural daylight through large windows",
      cameraFraming: "medium shot, slightly low angle",
    },
    {
      location: "home gym corner with yoga mat and dumbbells",
      outfit: "turquoise crop top and black leggings",
      action: "stretching after a workout, wiping sweat with a towel, smiling",
      lighting: "soft morning light",
      cameraFraming: "mirror selfie, phone visible in hand",
    },
    {
      location: "outdoor functional training park",
      outfit: "black sports bra and neon shorts",
      action: "resting between sets, drinking from a water bottle",
      lighting: "golden hour outdoor light",
      cameraFraming: "three-quarter body shot",
    },
  ],
  MORNING_ROUTINE: [
    {
      location: "bright student apartment kitchen",
      outfit: "oversized cream sweater, hair in a loose bun",
      action: "making a smoothie bowl, candid laugh",
      lighting: "soft morning window light",
      cameraFraming: "over-the-counter medium shot",
    },
    {
      location: "cozy bedroom with plants by the window",
      outfit: "matching pastel pajama set",
      action: "stretching in bed just after waking up, genuine smile",
      lighting: "warm early morning sunlight",
      cameraFraming: "close-up to medium shot",
    },
    {
      location: "bathroom mirror with skincare products",
      outfit: "white robe, hair towel-wrapped",
      action: "applying skincare, playful expression",
      lighting: "soft diffused bathroom lighting",
      cameraFraming: "mirror selfie",
    },
  ],
  COFFEE: [
    {
      location: "trendy Canadian coffee shop with large windows",
      outfit: "oversized beige hoodie and gold necklace",
      action: "holding a latte with latte art, candid smile toward camera",
      lighting: "soft overcast daylight through cafe windows",
      cameraFraming: "close-up, seated at a table",
    },
    {
      location: "outdoor cafe patio in autumn",
      outfit: "denim jacket over a white top",
      action: "laughing mid-conversation, coffee cup in hand",
      lighting: "warm afternoon light",
      cameraFraming: "medium shot, natural candid angle",
    },
    {
      location: "campus library café, laptop and notebook on the table",
      outfit: "casual sweater, hair down",
      action: "coffee break between classes, candid smile while holding a cup",
      lighting: "soft indoor daylight",
      cameraFraming: "medium shot, seated at a study table",
    },
  ],
  TENNIS: [
    {
      location: "outdoor tennis court, clear blue sky",
      outfit: "white tennis skirt and coral athletic top",
      action: "about to serve, mid-toss, focused determined expression",
      lighting: "bright midday sun",
      cameraFraming: "full body action shot",
    },
    {
      location: "tennis court bench, sitting between sets",
      outfit: "tennis dress, visor, racket resting on lap",
      action: "smiling at camera, wiping forehead with wristband",
      lighting: "bright natural daylight",
      cameraFraming: "medium shot",
    },
  ],
  BEACH: [
    {
      location: "turquoise water beach with palm trees",
      outfit: "yellow triangle bikini",
      action: "walking along the shoreline, hair blowing in the wind",
      lighting: "bright tropical midday sun",
      cameraFraming: "full body, walking toward camera",
    },
    {
      location: "beach with palm trees, straw hat visible",
      outfit: "mint green bikini with straw hat",
      action: "sitting on the sand, candid laughing selfie",
      lighting: "warm golden hour light",
      cameraFraming: "selfie close-up",
    },
    {
      location: "beach under palm trees",
      outfit: "red bikini set",
      action: "playful pose reaching up to a palm branch, smiling",
      lighting: "bright tropical sunlight",
      cameraFraming: "medium to full body",
    },
  ],
  MIRROR_SELFIE: [
    {
      location: "minimalist bedroom mirror",
      outfit: "matching loungewear set in brand coral/turquoise tones",
      action: "classic mirror selfie, phone held at chest height",
      lighting: "soft indoor daylight",
      cameraFraming: "vertical mirror selfie",
    },
    {
      location: "gym locker room mirror",
      outfit: "post-workout sports bra and leggings",
      action: "candid mirror selfie, slightly out of breath smile",
      lighting: "bright gym lighting",
      cameraFraming: "vertical mirror selfie",
    },
    {
      location: "dorm room mirror, string lights and desk with textbooks visible in background",
      outfit: "casual oversized hoodie and shorts, hair in a messy bun",
      action: "relaxed evening mirror selfie between study sessions, playful peace sign",
      lighting: "warm string-light glow mixed with desk lamp",
      cameraFraming: "vertical mirror selfie",
    },
  ],
  HEALTHY_FOOD: [
    {
      location: "bright kitchen countertop",
      outfit: "casual home outfit, apron optional",
      action: "plating an acai bowl with fresh fruit, candid smile",
      lighting: "soft natural window light",
      cameraFraming: "overhead flat-lay plus candid face shot",
    },
    {
      location: "outdoor picnic table",
      outfit: "sundress",
      action: "holding an avocado toast, playful bite pose",
      lighting: "bright daylight",
      cameraFraming: "medium shot",
    },
  ],
  TRAVEL: [
    {
      location: "Canadian mountain viewpoint",
      outfit: "cozy oversized jacket and beanie",
      action: "looking out at the view, candid three-quarter pose",
      lighting: "crisp clear daylight",
      cameraFraming: "medium to full body, scenic background",
    },
    {
      location: "airport terminal with luggage",
      outfit: "comfy travel outfit, sunglasses on head",
      action: "candid walking shot, small suitcase in hand",
      lighting: "bright indoor daylight",
      cameraFraming: "full body candid",
    },
  ],
  CASUAL_DATE: [
    {
      location: "cozy restaurant with warm ambient lighting",
      outfit: "simple elegant dress in brand colors",
      action: "candid laughing moment, hand near face",
      lighting: "warm evening ambient light",
      cameraFraming: "medium close-up",
    },
  ],
  BEHIND_THE_SCENES: [
    {
      location: "content creation setup, ring light visible",
      outfit: "casual comfy outfit",
      action: "candid behind-the-scenes moment setting up a phone tripod, laughing at a mistake",
      lighting: "mixed ring light and daylight",
      cameraFraming: "candid, slightly imperfect framing for authenticity",
    },
  ],
  ROOM_SELFIE: [
    {
      location: "small dorm room with fairy lights and a desk in the background",
      outfit: "oversized university hoodie",
      action: "casual selfie lying on the bed, relaxed candid smile",
      lighting: "warm evening lamp light",
      cameraFraming: "close-up selfie, phone held above",
    },
    {
      location: "shared student apartment bedroom, laundry basket and posters visible",
      outfit: "comfy oversized t-shirt and messy bun",
      action: "candid selfie taking a study break, tired but smiling",
      lighting: "soft desk lamp light, evening",
      cameraFraming: "close-up selfie, slightly high angle",
    },
    {
      location: "dorm room window seat with a blanket",
      outfit: "cozy knit sweater",
      action: "candid selfie with a cup of tea, relaxed weekend vibe",
      lighting: "soft overcast daylight through window",
      cameraFraming: "close-up to medium selfie",
    },
  ],
  LIBRARY_STUDY: [
    {
      location: "university library, quiet study area with tall bookshelves",
      outfit: "oversized cardigan over a plain top, glasses on",
      action: "candid studying shot, laptop and textbooks open, focused but smiling slightly at camera",
      lighting: "soft warm library lamp light",
      cameraFraming: "medium shot, slightly candid/off-angle",
    },
    {
      location: "library study nook between bookshelves",
      outfit: "casual sweater, hair in a claw clip",
      action: "candid selfie during a study break, coffee cup and textbooks visible",
      lighting: "warm indoor lighting mixed with window daylight",
      cameraFraming: "close-up selfie",
    },
    {
      location: "dorm room desk, fairy lights and sticky notes on the wall",
      outfit: "comfy sweatshirt, hair in a bun, pen behind ear",
      action: "candid late-night study session, tired but smiling reaction to camera",
      lighting: "warm desk lamp light, dim room",
      cameraFraming: "close-up to medium shot",
    },
  ],
};

/** Hashtag pools per genre (English + a couple of broad reach tags) */
export const GENRE_HASHTAGS: Record<ContentGenre, string[]> = {
  GYM: ["#gymgirl", "#fitnessmotivation", "#glutesworkout", "#gymtok"],
  MORNING_ROUTINE: ["#morningroutine", "#thatgirl", "#healthyhabits"],
  COFFEE: ["#coffeelover", "#cafevibes", "#latteart"],
  TENNIS: ["#tennisgirl", "#tennislife", "#tennisplayer"],
  BEACH: ["#beachday", "#beachvibes", "#bikinigirl"],
  MIRROR_SELFIE: ["#ootd", "#mirrorselfie", "#fitcheck"],
  HEALTHY_FOOD: ["#healthyfood", "#acaibowl", "#foodie"],
  TRAVEL: ["#studyabroad", "#traveldiaries", "#canadalife"],
  CASUAL_DATE: ["#datenight", "#ootn"],
  BEHIND_THE_SCENES: ["#btsvlog", "#dayinmylife", "#contentcreator"],
  ROOM_SELFIE: ["#dormlife", "#studentlife", "#selfie"],
  LIBRARY_STUDY: ["#studygram", "#studywithme", "#internationalstudent"],
};

/**
 * Daily image quota per genre. Must sum to config.targets.imagesPerDay (20).
 * Weighted toward genres that suit an international-student persona
 * (room selfie / library study) while keeping the original lifestyle mix.
 */
export const GENRE_DAILY_QUOTA: Record<ContentGenre, number> = {
  GYM: 2,
  MORNING_ROUTINE: 2,
  COFFEE: 2,
  TENNIS: 1,
  BEACH: 2,
  MIRROR_SELFIE: 2,
  HEALTHY_FOOD: 2,
  TRAVEL: 1,
  CASUAL_DATE: 1,
  BEHIND_THE_SCENES: 1,
  ROOM_SELFIE: 2,
  LIBRARY_STUDY: 2,
};
