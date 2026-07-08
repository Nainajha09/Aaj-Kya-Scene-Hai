import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndRecordUsage } from "@/lib/rateLimit";

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

  // Pull real people and real live scenes so the AI can make specific,
  // grounded recommendations instead of generic advice. Capped at 25/15
  // rows so the context stays small and cheap even as the app grows.
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

  const peopleList =
    (people ?? [])
      .map(
        (p) =>
          `- ${p.name || "Unnamed"} (id: ${p.id}) — role: ${p.role || "unknown"}, into: ${
            p.obsession || "unknown"
          }, bio: ${p.one_liner || "none"}`
      )
      .join("\n") || "No one else has signed up yet.";

  const sceneList =
    (scenes ?? [])
      .map((s) => `- ${s.name} (${s.tag})${s.vibe ? ` — ${s.vibe}` : ""}`)
      .join("\n") || "No live scenes right now.";

  const SYSTEM_PROMPT = `You are 'Scene Concierge', a witty, warm AI networking assistant inside a Gen-Z/millennial office-networking app called 'Aaj Kya Scene Hai'. You help people figure out who to meet, draft icebreakers, and plan coffee chats. Keep replies short (3-5 sentences max), practical, and a little playful. Hinglish flavor is welcome but keep it readable. Never be corporate or generic.

You have access to REAL current data about this app — use it to make specific recommendations instead of generic ones. Only reference people and scenes from the lists below; never invent names or scenes that aren't listed. If someone asks about something not covered by this data, say so honestly instead of making it up.

PEOPLE CURRENTLY ON THE APP:
${peopleList}

LIVE SCENES RIGHT NOW:
${sceneList}

When you recommend a specific person, mention their real name so the user can find them in Chats. You cannot send messages on the user's behalf — only suggest who to talk to and what to say.`;

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
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
    const text = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ result: text });
  } catch (err) {
    console.error("Unexpected error calling Groq:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}