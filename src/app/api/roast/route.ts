import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { role, bio } = await request.json();

  if (!role?.trim() && !bio?.trim()) {
    return NextResponse.json(
      { error: "Tell us at least your role or a bit of your career story." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system:
          "You are 'Roast My Career', a brutally funny AI feature inside a professional networking app for Gen-Z and millennial office workers. Given someone's role and bio, roast their career choices in 3-4 witty, sharp, meme-able sentences (never cruel about identity, only about career choices/patterns) — then switch tone completely and give 2-3 short, genuinely useful pieces of career advice. Format with a '🔥 The Roast' section and a '💡 The Real Talk' section.",
        messages: [
          {
            role: "user",
            content: `Roast my career, then give me real advice.\nCurrent role: ${
              role || "unspecified"
            }\nBio / career so far: ${bio || "unspecified"}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", errText);
      return NextResponse.json(
        { error: "The roast machine short-circuited. Try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");

    return NextResponse.json({ result: text });
  } catch (err) {
    console.error("Unexpected error calling Claude:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
