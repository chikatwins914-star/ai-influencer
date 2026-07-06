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
      outfit: "flowy yellow linen sundress",
      action: "walking along the shoreline, hair blowing in the wind",
      lighting: "bright tropical midday sun",
      cameraFraming: "full body, walking toward camera",
    },
    {
      location: "beach with palm trees, straw hat visible",
      outfit: "white cotton beach dress with a straw hat",
      action: "sitting on the sand, candid laughing selfie",
      lighting: "warm golden hour light",
      cameraFraming: "selfie close-up",
    },
    {
      location: "beach under palm trees",
      outfit: "red wrap-style beach dress",
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
    {
      location: "simple bedroom with a plain wall backdrop",
      outfit: "fitted black mini dress with a draped cowl neckline",
      action: "trying on the outfit, one hand running through hair, turning slightly to show the fit",
      lighting: "soft natural daylight from a window",
      cameraFraming: "medium shot, full outfit visible",
    },
    {
      location: "simple bedroom with a plain wall backdrop",
      outfit: "fitted beige mini dress with a draped neckline",
      action: "hands on hips, confident pose showing off the outfit",
      lighting: "soft natural daylight from a window",
      cameraFraming: "medium shot, full outfit visible",
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
  MOTIVATION: [
    {
      location: "empty gym at sunrise, sunlight streaking through the windows",
      outfit: "matching black sports bra and leggings set",
      action: "pausing mid-set, determined focused expression looking straight at camera",
      lighting: "dramatic golden hour side light",
      cameraFraming: "low-angle medium shot, cinematic",
    },
    {
      location: "outdoor track before dawn, city skyline in the distance",
      outfit: "fitted running set with a cropped jacket",
      action: "finishing a run, hands on hips, catching breath, resolute expression",
      lighting: "cool pre-dawn light transitioning to sunrise",
      cameraFraming: "wide establishing shot into a slow push-in",
    },
    {
      location: "minimalist bedroom desk with a journal and cup of coffee",
      outfit: "plain fitted tank top, hair pulled back",
      action: "writing in a journal, then looking up at camera with quiet intensity",
      lighting: "soft directional window light, moody contrast",
      cameraFraming: "close-up on hands, cut to close-up on face",
    },
  ],
};

/** Hashtag pools per genre (English + a couple of broad reach tags) */
export const GENRE_HASHTAGS: Record<ContentGenre, string[]> = {
  GYM: ["#gymgirl", "#fitnessmotivation", "#glutesworkout", "#gymtok"],
  MORNING_ROUTINE: ["#morningroutine", "#thatgirl", "#healthyhabits"],
  COFFEE: ["#coffeelover", "#cafevibes", "#latteart"],
  TENNIS: ["#tennisgirl", "#tennislife", "#tennisplayer"],
  BEACH: ["#beachday", "#beachvibes", "#summerdress"],
  MIRROR_SELFIE: ["#ootd", "#mirrorselfie", "#fitcheck"],
  HEALTHY_FOOD: ["#healthyfood", "#acaibowl", "#foodie"],
  TRAVEL: ["#studyabroad", "#traveldiaries", "#canadalife"],
  CASUAL_DATE: ["#datenight", "#ootn", "#ootd", "#outfitcheck"],
  BEHIND_THE_SCENES: ["#btsvlog", "#dayinmylife", "#contentcreator"],
  ROOM_SELFIE: ["#dormlife", "#studentlife", "#selfie"],
  LIBRARY_STUDY: ["#studygram", "#studywithme", "#internationalstudent"],
  MOTIVATION: ["#motivation", "#mindset", "#disciplineoverfeelings", "#dailymotivation", "#successmindset"],
};

/**
 * Daily image *scene* quota per genre — each scene expands into
 * ANGLE_VARIANTS.length (4) images, so this must sum to
 * config.targets.imagesPerDay / 4 (= 5) to hit the 20 images/day target.
 * Narrowed down to only ROOM_SELFIE/BEACH/CASUAL_DATE per explicit request
 * — all other genres are kept in the Record (for type completeness and in
 * case they're re-enabled later) but at 0.
 */
export const GENRE_DAILY_QUOTA: Record<ContentGenre, number> = {
  GYM: 0,
  MORNING_ROUTINE: 0,
  COFFEE: 0,
  TENNIS: 0,
  BEACH: 2,
  MIRROR_SELFIE: 0,
  HEALTHY_FOOD: 0,
  TRAVEL: 0,
  CASUAL_DATE: 1,
  BEHIND_THE_SCENES: 0,
  ROOM_SELFIE: 2,
  LIBRARY_STUDY: 0,
  MOTIVATION: 0,
};
