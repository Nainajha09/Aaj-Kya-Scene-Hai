import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const { role, obsession } = await request.json();

  if (!role?.trim()) {
    return NextResponse.json(
      { error: "Add a role first so there's something to work with." },
      { status: 400 }
    );
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
          max_tokens: 60,
          messages: [
            {
              role: "system",
              content:
                "Write a single punchy one-line bio, under 18 words, playful and specific, no corporate speak, no hashtags, no quotation marks. Output only the bio line, nothing else.",
            },
            {
              role: "user",
              content: `Role: ${role}. Current obsession: ${
                obsession || "unspecified"
              }. Write a vibe-first one-line bio for a networking app profile.`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: "Bio generator's on a coffee break. Try again?" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = (data.choices?.[0]?.message?.content ?? "").replace(
      /^"|"$/g,
      ""
    );

    return NextResponse.json({ result: text });
  } catch (err) {
    console.error("Unexpected error calling Groq:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}