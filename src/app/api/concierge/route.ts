import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndRecordUsage } from "@/lib/rateLimit";

type PersonRow = { id: string; name: string; role: string; obsession: string; one_liner: string };
type SceneRow = { id: number; name: string; tag: string; vibe: string | null };

function tokenize(text: string): string[] {
  return (text || "").toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

// Every real word that's fair game to appear in a response — built
// directly from the real data we gave the AI, plus a small list of
// ordinary words that aren't names.
function buildAllowedWords(people: PersonRow[], scenes: SceneRow[]): Set<string> {
  const words = new Set<string>();
  const addAll = (s: string) => tokenize(s).forEach((w) => words.add(w));
  people.forEach((p) => {
    addAll(p.name);
    addAll(p.role);
    addAll(p.obsession);
    addAll(p.one_liner);
  });
  scenes.forEach((s) => {
    addAll(s.name);
    addAll(s.tag);
    addAll(s.vibe || "");
  });
  [
    "hey", "heyyy", "hi", "hello", "tell", "want", "the", "ai", "pm",
    "scene", "concierge", "app", "chats", "radar", "chat", "sounds",
  ].forEach((w) => words.add(w));
  return words;
}

// Looks for capitalized words appearing mid-sentence (not at the start,
// which is normal capitalization) that aren't part of our real data —
// this is how we catch an invented name like "Rohan" that was never
// actually in the people list.
function findSuspiciousWords(text: string, allowed: Set<string>): string[] {
  const matches = text.match(/(?<=[a-z,]\s)([A-Z][a-zA-Z'-]+)/g) ?? [];
  return [...new Set(matches.filter((w) => !allowed.has(w.toLowerCase())))];
}

// A response built only from real rows — cannot possibly invent anyone,
// since it never asks the AI to name people at all.
function safeFallback(userMessage: string, people: PersonRow[]): string {
  const queryWords = tokenize(userMessage).filter((w) => w.length > 2);
  const matches = people.filter((p) => {
    const haystack = `${p.role} ${p.obsession} ${p.one_liner}`.toLowerCase();
    return queryWords.some((w) => haystack.includes(w));
  });
  const pool = matches.length > 0 ? matches : people;
  const picks = pool
    .slice(0, 3)
    .map((p) => p.name)
    .filter(Boolean) as string[];

  if (picks.length === 0) {
    return "I don't want to make anyone up — and I don't see a specific match on the app for that yet. Check Radar for who's around right now instead.";
  }
  return `I don't want to invent anyone — but here's who's actually on the app right now: ${picks.join(
    ", "
  )}. Worth checking their profiles in Chats.`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const allowed = await checkAndRecordUsage(supabase, user.id, "concierge", 30, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've hit the hourly limit for chatting with me. Try again in a bit." },
      { status: 429 }
    );
  }

  const { messages } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const [{ data: people }, { data: scenes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, role, obsession, one_liner")
      .neq("id", user.id)
      .limit(25),
    supabase
      .from("scenes")
      .select("id, name, tag, vibe")
      .eq("is_live", true)
      .limit(15),
  ]);

  const peopleRows = (people ?? []) as PersonRow[];
  const sceneRows = (scenes ?? []) as SceneRow[];

  const peopleList =
    peopleRows
      .map(
        (p) =>
          `- ${p.name || "Unnamed"} (id: ${p.id}) — role: ${p.role || "unknown"}, into: ${
            p.obsession || "unknown"
          }, bio: ${p.one_liner || "none"}`
      )
      .join("\n") || "No one else has signed up yet.";

  const sceneList =
    sceneRows.map((s) => `- ${s.name} (${s.tag})${s.vibe ? ` — ${s.vibe}` : ""}`).join("\n") ||
    "No live scenes right now.";

  const SYSTEM_PROMPT = `You are 'Scene Concierge', a witty, warm AI networking assistant inside a Gen-Z/millennial office-networking app called 'Aaj Kya Scene Hai'. You help people figure out who to meet, draft icebreakers, and plan coffee chats. Keep replies short (3-5 sentences max), practical, and a little playful. Hinglish flavor is welcome but keep it readable. Never be corporate or generic.

CRITICAL RULE: You may ONLY mention people and scenes explicitly listed below, using their exact real names. If nothing in these lists matches what the user is asking for, say so plainly and honestly — for example "I don't see anyone like that on the app yet." Inventing a name, a company, a role, or any detail that isn't listed below is a serious failure, even if it makes your answer sound better. Being accurate matters more than being impressive.

PEOPLE CURRENTLY ON THE APP:
${peopleList}

LIVE SCENES RIGHT NOW:
${sceneList}

You cannot send messages on the user's behalf — only suggest who to talk to and what to say.`;

  const REMINDER = `Reminder before you respond: only use exact names from the lists above. If there's no real match, say so honestly instead of inventing someone. This matters more than sounding helpful.`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 350,
          temperature: 0.4,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
            { role: "system", content: REMINDER },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: "Signal dropped for a sec — try that again?" },
        { status: 500 }
      );
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content ?? "";

    // Verification layer: check every capitalized word the AI used
    // against what's actually real. If it invented something, throw
    // the response away entirely rather than let a fabrication through.
    const allowedWords = buildAllowedWords(peopleRows, sceneRows);
    const suspicious = findSuspiciousWords(text, allowedWords);
    if (suspicious.length > 0) {
      console.warn("Concierge hallucination blocked:", suspicious, "| original:", text);
      const lastUserMessage =
        [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";
      text = safeFallback(lastUserMessage, peopleRows);
    }

    return NextResponse.json({ result: text });
  } catch (err) {
    console.error("Unexpected error calling Groq:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}