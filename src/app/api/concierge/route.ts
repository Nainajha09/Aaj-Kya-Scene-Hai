import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndRecordUsage } from "@/lib/rateLimit";

const SYSTEM_PROMPT =
  "You are 'Scene Concierge', a witty, warm AI networking assistant inside a Gen-Z/millennial office-networking app called 'Aaj Kya Scene Hai'. You help people figure out who to meet, draft icebreakers, and plan coffee chats. Keep replies short (3-5 sentences max), practical, and a little playful. Hinglish flavor is welcome but keep it readable. Never be corporate or generic.";

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
          max_tokens: 300,
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