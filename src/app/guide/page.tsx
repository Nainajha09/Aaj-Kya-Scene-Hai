"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import TourOverlay from "@/components/TourOverlay";

type Section = {
  emoji: string;
  title: string;
  tagline: string;
  content: string[];
};

const SECTIONS: Section[] = [
  {
    emoji: "🏠",
    title: "Scene (Home)",
    tagline: "The pulse of the app — what's happening, right now.",
    content: [
      "The scrolling ticker at the top shows real check-ins from real people — no fake activity here.",
      "✨ Aaj Ka Scene Report is an AI-written daily briefing based on actual numbers from the app (live scenes, check-ins, total people). Hit ↻ Refresh to get a new take.",
      "🏆 Scene Leaderboard shows the top 5 people by Scene Score. Not in the top 5? It'll quietly tell you your real rank.",
      "🔥 Scene of the Week is whichever scene had the most check-ins in the last 7 days — chase the crown.",
      "Someone to meet suggests a real person on the app you haven't talked to yet. One tap takes you straight to Chats with them.",
    ],
  },
  {
    emoji: "📍",
    title: "Radar",
    tagline: "Find out what's happening near you — or start it yourself.",
    content: [
      "Every scene here is real — either seeded by the app or started by an actual user like you.",
      "Tap + Start a Scene where you are to create one. You can share your live location, or search for a specific venue if you're setting it up ahead of time.",
      "Tap any scene card to see who's actually checked in, get a real walking/driving ETA based on your GPS, and join with one tap.",
      "Joining a scene earns you +10 Scene Score — do it a few times and watch your level climb (Lurker → Starter → Regular → Connector → Legend).",
      "Started a scene yourself? You'll see Edit and Delete buttons that only you can use — nobody else can touch your scene.",
      "Everything updates live — if someone else joins while you're looking at the screen, you'll see it change without refreshing.",
    ],
  },
  {
    emoji: "💬",
    title: "Chats",
    tagline: "Real conversations, not cold DMs.",
    content: [
      "Tap anyone's name to open a real, live conversation — messages appear instantly on both ends, no refresh needed.",
      "Starting fresh with someone? Hit ✨ Suggest an icebreaker and the AI will draft an opening line based on both your real profiles — not generic small talk.",
      "Unread messages show up as a little badge on that person's name, and on the Chats tab itself, so you never miss one.",
      "Nothing gets sent without you hitting Send — the AI only ever fills the text box, you're always the one in control.",
    ],
  },
  {
    emoji: "🤖",
    title: "AI Concierge",
    tagline: "Your wingman for figuring out who to meet.",
    content: [
      "Tell it a goal — 'I want to meet fintech PMs' or 'find me a design mentor' — and it'll look at who's actually on the app right now and suggest real people by name.",
      "It knows about real live scenes too, so it might point you toward one worth checking out.",
      "It will never make someone up. If there's genuinely no match for what you're looking for, it'll tell you honestly instead of inventing a person.",
      "It can't send messages for you — think of it as a smart friend giving you a nudge, not an autopilot.",
    ],
  },
  {
    emoji: "🔥",
    title: "Roast My Career",
    tagline: "Brutally honest. Weirdly useful. Screenshot-worthy.",
    content: [
      "Type in your current role and a few lines about your career — the AI will roast your choices, then flip completely and give you genuinely useful advice.",
      "It's meant to sting a little and make you laugh — screenshot it and send it to a friend who needs the same wake-up call.",
    ],
  },
  {
    emoji: "👤",
    title: "You (Profile)",
    tagline: "Your vibe, your score, your scenes.",
    content: [
      "Fill in your role and current obsession, then hit ✨ Generate my vibe bio to let AI write your one-liner for you — or write your own.",
      "Your Scene Score and level live right at the top, with a progress bar showing how close you are to the next level.",
      "Scroll down to see every scene you're currently checked into.",
      "Everything here is visible to other people on the app — it's how they decide whether to say hi.",
    ],
  },
  {
    emoji: "🎮",
    title: "Scene Score & Levels",
    tagline: "The game running underneath everything.",
    content: [
      "You earn points mainly by joining scenes on Radar (+10 each).",
      "Levels: Scene Lurker (0) → Scene Starter (50) → Scene Regular (150) → Scene Connector (300) → Scene Legend (600).",
      "Your score and rank are visible to everyone on the Leaderboard — a little competition never hurt anyone.",
    ],
  },
  {
    emoji: "💡",
    title: "Good to know",
    tagline: "A few honest notes.",
    content: [
      "AI features (Roast, Concierge, Icebreaker, Daily Report) have a fair-use hourly limit per person — if you hit it, just wait a bit and try again.",
      "Radar scenes are either seeded by the app or added by real users — nothing here is fake activity dressed up to look busy.",
      "This app is genuinely still growing — the fewer people on it right now, the more your check-ins and messages actually matter.",
    ],
  },
];

export default function GuidePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#15132a] text-[#f3eefb] p-6 pb-20">
      <div className="max-w-sm mx-auto">
        <a href="/profile" className="text-xs text-[#b6abd9] mb-3 inline-block">
          ← Back to Profile
        </a>
        <h1 className="text-2xl font-bold mb-1">📖 How This App Works</h1>
        <p className="text-sm text-[#b6abd9] mb-6">
          Everything explained, no boring manual energy.
        </p>

        <div className="space-y-3">
          {SECTIONS.map((section, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={section.title}
                className="rounded-2xl bg-[#221f38] border border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.emoji}</span>
                    <div>
                      <div className="font-bold text-[15px]">{section.title}</div>
                      <div className="text-xs text-[#b6abd9]">{section.tagline}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[#b298e7] text-lg transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {section.content.map((line, j) => (
                      <p key={j} className="text-sm text-[#f3eefb]/90 leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <a
          href="/feed?tour=1"
          className="block text-center text-xs font-semibold text-[#b298e7] mt-6"
        >
          🎯 Take the guided tour again
        </a>

        <p className="text-xs text-[#b6abd9] text-center mt-3">
          Still confused about something? That probably means it needs fixing, not you. 🫶
        </p>
      </div>
      <BottomNav />
      <TourOverlay />
    </main>
  );
}
