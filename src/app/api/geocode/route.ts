import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
      query
    )}`;

    // Nominatim's usage policy requires a descriptive User-Agent —
    // browsers won't let client-side fetch set this header, so this
    // request has to go through our own server instead.
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AajKyaSceneHai/1.0 (networking app, testing phase)",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Search failed." }, { status: 500 });
    }

    const data = await response.json();
    const results = (data as Array<{ display_name: string; lat: string; lon: string }>).map(
      (r) => ({
        name: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}