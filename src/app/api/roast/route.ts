import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { role, bio } = await request.json();

  if (!role?.trim() && !bio?.trim()) {
    return NextResponse.json(
      { error: "Tell us at least your role or a bit of your career story." },
      { status: 400 }
    );
  }

  const systemPrompt =
    "You are 'Roast My Career', a brutally funny AI feature inside a professional networking app for Gen-Z and millennial office workers. Given someone's role and bio, roast their career choices in 3-4 witty, sharp, meme-able sentences (never cruel about identity, only about career choices/patterns) — then switch tone completely and give 2-3 short, genuinely useful pieces of career advice. Format with a '🔥 The Roast' section and a '💡 The Real Talk' section.";

  const userPrompt = `Roast my career, then give me real advice.\nCurrent role: ${
    role || "unspecified"
  }\nBio / career so far: ${bio || "unspecified"}`;

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
          max_tokens: 500,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: "The roast machine short-circuited. Try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    if (!text) {
      console.error("Groq returned no text:", JSON.stringify(data));
      return NextResponse.json(
        { error: "The roast machine had nothing to say. Try again." },
        { status: 500 }
      );
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