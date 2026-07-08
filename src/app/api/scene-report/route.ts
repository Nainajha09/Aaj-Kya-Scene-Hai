import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { liveScenes, activeCheckins, totalUsers } = await request.json();

  const userPrompt = `Real current stats from the app: ${liveScenes} live scenes right now, ${activeCheckins} people currently checked into scenes, ${totalUsers} total people signed up. Write a short, punchy 2-sentence 'daily scene report' using these real numbers naturally (don't just list them like a spreadsheet). Playful Hinglish-friendly tone, no hashtags, under 40 words. If numbers are very low (like 0 or 1), acknowledge that honestly and playfully rather than pretending it's a huge scene.`;

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
