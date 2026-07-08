export type TourStep = {
  path: string;
  label: string;
  title: string;
  description: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    path: "/feed",
    label: "Scene",
    title: "👋 This is your Scene",
    description:
      "Real activity from real people, an AI daily report, and the leaderboard — this is home base.",
  },
  {
    path: "/radar",
    label: "Radar",
    title: "📍 Find or start a scene",
    description:
      "See real cafés, meetups, and coworking spots happening nearby — or tap \"+ Start a Scene\" to create your own and invite people.",
  },
  {
    path: "/chats",
    label: "Chats",
    title: "💬 Talk to real people",
    description:
      "Message anyone directly. Stuck on what to say first? Try the ✨ AI icebreaker button in the chat.",
  },
  {
    path: "/concierge",
    label: "AI",
    title: "🤖 Your AI wingman",
    description:
      "Tell it who you're hoping to meet, and it'll point you to real people already on the app.",
  },
  {
    path: "/roast",
    label: "Roast",
    title: "🔥 Roast My Career",
    description:
      "Purely for fun (and weirdly good advice) — let AI roast your career choices, then give you real tips.",
  },
];

export function getStepIndexForPath(path: string): number {
  return TOUR_STEPS.findIndex((s) => s.path === path);
}