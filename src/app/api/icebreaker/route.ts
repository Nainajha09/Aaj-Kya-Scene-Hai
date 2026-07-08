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

  const allowed = await checkAndRecordUsage(supabase, user.id, "icebreaker", 20, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've hit the hourly limit for icebreakers. Try again in a bit." },
      { status: 429 }
    );
  }

  const { otherName, otherRole, otherOneLiner, otherObsession, myRole, myObsession } =
    await request.json();

  const userPrompt = `I'm about to message someone for the first time on a professional networking app.
Me: role is "${myRole || "unspecified"}", into "${myObsession || "unspecified"}".
Them: name is ${otherName || "this person"}, role is "${otherRole || "unspecified"}", bio is "${
    otherOneLiner || "unspecified"
  }", into "${otherObsession || "unspecified"}".
Write ONE short, casual, specific opening message I could send them — reference something real from what's given (a shared interest, their role, their bio) rather than being generic. No "Hi, how are you" energy. Under 25 words. Output only the message, nothing else, no quotation marks.`;

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
          max_tokens: 80,
          messages: [
            {
              role: "system",
              content:
                "You write short, specific, warm opening messages for a professional networking app. Never generic, never corporate, never a full paragraph. Just one punchy real-feeling line.",
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
        { error: "Couldn't come up with anything. Try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = (data.choices?.[0]?.message?.content ?? "").replace(/^"|"$/g, "");

    return NextResponse.json({ result: text });
  } catch (err) {
    console.error("Unexpected error calling Groq:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}