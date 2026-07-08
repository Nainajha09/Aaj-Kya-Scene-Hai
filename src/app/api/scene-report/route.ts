import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  // Calculated here, not trusted from the request body — otherwise
  // anyone could pass fake numbers to manipulate the AI's output.
  const [{ count: liveScenes }, { count: activeCheckins }, { count: totalUsers }] =
    await Promise.all([
      supabase.from("scenes").select("*", { count: "exact", head: true }).eq("is_live", true),
      supabase.from("checkins").select("*", { count: "exact", head: true }).is("left_at", null),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

  const userPrompt = `Real current stats from the app: ${liveScenes ?? 0} live scenes right now, ${
    activeCheckins ?? 0
  } people currently checked into scenes, ${
    totalUsers ?? 0
  } total people signed up. Write a short, punchy 2-sentence 'daily scene report' using these real numbers naturally (don't just list them like a spreadsheet). Playful Hinglish-friendly tone, no hashtags, under 40 words. If numbers are very low (like 0 or 1), acknowledge that honestly and playfully rather than pretending it's a huge scene.`;

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
          max_tokens: 100,
          messages: [
            {
              role: "system",
              content:
                "You write short, energetic daily briefings for a professional networking app called 'Aaj Kya Scene Hai'. Tone: witty, warm, a little cheeky, never corporate. You only use the real numbers given to you — never invent job changes, names, or events that weren't provided.",
            },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: "Couldn't reach the scene right now." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ result: text });
  } catch (err) {
    console.error("Unexpected error calling Groq:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}