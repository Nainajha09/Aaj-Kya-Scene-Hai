import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import DailyReport from "./DailyReport";
import { levelFor } from "@/lib/levels";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: recentCheckins },
    { data: popupScenes },
    { data: otherProfiles },
    { data: topProfiles },
    { data: myProfile },
    { data: recentSceneCheckins },
  ] = await Promise.all([
    supabase
      .from("checkins")
      .select("joined_at, profiles(name), scenes(name)")
      .order("joined_at", { ascending: false })
      .limit(10),
    supabase
      .from("scenes")
      .select("*")
      .in("tag", ["Pop-up Scene", "Party"])
      .eq("is_live", true)
      .limit(1),
    supabase.from("profiles").select("id, name, role, one_liner").neq("id", user.id).limit(5),
    supabase.from("profiles").select("id, name, role, score").order("score", { ascending: false }).limit(5),
    supabase.from("profiles").select("score").eq("id", user.id).single(),
    supabase
      .from("checkins")
      .select("scene_id, scenes(name)")
      .gte("joined_at", sevenDaysAgo),
  ]);

  const tickerItems = (recentCheckins ?? [])
    .map((c) => {
      const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
      const scene = Array.isArray(c.scenes) ? c.scenes[0] : c.scenes;
      if (!profile || !scene) return null;
      return `📍 ${profile.name || "Someone"} checked into ${scene.name} · ${timeAgo(
        c.joined_at
      )}`;
    })
    .filter(Boolean) as string[];

  const twoDegreesSuggestion =
    (otherProfiles ?? [])[Math.floor(Math.random() * (otherProfiles?.length || 1))] || null;

  // Rank isn't shown for the top 5 (they're already visible), but useful
  // context if you're further down the list.
  const myScore = myProfile?.score ?? 0;
  const inTop5 = (topProfiles ?? []).some((p) => p.id === user.id);
  let myRank: number | null = null;
  if (!inTop5) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gt("score", myScore);
    myRank = (count ?? 0) + 1;
  }

  // Scene of the Week  whichever scene had the most check-ins in the
  // last 7 days, computed from real check-in data.
  const sceneCounts: Record<string, { name: string; count: number }> = {};
  (recentSceneCheckins ?? []).forEach((c) => {
    const scene = Array.isArray(c.scenes) ? c.scenes[0] : c.scenes;
    if (!scene) return;
    const key = String(c.scene_id);
    sceneCounts[key] = {
      name: scene.name,
      count: (sceneCounts[key]?.count ?? 0) + 1,
    };
  });
  const sceneOfWeek = Object.values(sceneCounts).sort((a, b) => b.count - a.count)[0] ?? null;

  return (
    <main className="min-h-screen bg-[#16151d] text-[#efe9dd] pb-20">
      {/* Ticker */}
      <div className="bg-[#0c0a14] border-b border-white/5 overflow-hidden whitespace-nowrap py-2">
        {tickerItems.length > 0 ? (
          <div className="inline-flex animate-[scroll_30s_linear_infinite]">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="text-[11px] font-mono text-[#aca3bd] px-5">
                {t} <span className="opacity-30">●</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-[#aca3bd] px-5">
            No activity yet — go check into a scene to get things moving.
          </span>
        )}
      </div>

      <div className="max-w-sm mx-auto p-6">
        <h1 className="text-2xl font-bold mb-1">Aaj Kya Scene Hai</h1>
        <p className="text-sm text-[#aca3bd] mb-6">What&apos;s happening right now.</p>

        <DailyReport />

        {sceneOfWeek && (
          <div className="rounded-2xl bg-[#1f1d27] border border-white/5 p-4 mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#9cbf7a] mb-1">
              🔥 Scene of the Week
            </div>
            <div className="font-bold text-[15px] mb-1">{sceneOfWeek.name}</div>
            <div className="text-xs text-[#aca3bd]">
              {sceneOfWeek.count} check-in{sceneOfWeek.count === 1 ? "" : "s"} this week
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[#1f1d27] border border-white/5 p-4 mt-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#cf8a5e] mb-3">
            🏆 Scene Leaderboard
          </div>
          <div className="space-y-3">
            {(topProfiles ?? []).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-5 text-xs font-mono text-[#aca3bd]">#{i + 1}</div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold text-[#1a1108] flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #cf8a5e, #b5657f)" }}
                >
                  {initials(p.name || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {p.name || "Unnamed"} {p.id === user.id && "(you)"}
                  </div>
                  <div className="text-[11px] text-[#aca3bd]">{levelFor(p.score).name}</div>
                </div>
                <div className="text-xs font-mono text-[#cf8a5e]">{p.score}</div>
              </div>
            ))}
            {(!topProfiles || topProfiles.length === 0) && (
              <p className="text-sm text-[#aca3bd]">No one's scored points yet.</p>
            )}
          </div>
          {myRank && (
            <div className="text-xs text-[#aca3bd] mt-3 pt-3 border-t border-white/5">
              You&apos;re ranked #{myRank} with {myScore} points.
            </div>
          )}
        </div>

        {popupScenes && popupScenes.length > 0 && (
          <div className="rounded-2xl bg-[#1f1d27] border border-white/5 p-4 mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#9cbf7a] mb-1">
              Pop-up Scene
            </div>
            <div className="font-bold text-[15px] mb-2">{popupScenes[0].name}</div>
            <a href="/radar" className="text-xs font-semibold text-[#cf8a5e]">
              → Check it out on Radar
            </a>
          </div>
        )}

        {twoDegreesSuggestion && (
          <div className="rounded-2xl bg-[#1f1d27] border border-white/5 p-4 mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#b5657f] mb-1">
              Someone to meet
            </div>
            <div className="font-bold text-[15px]">{twoDegreesSuggestion.name || "Someone"}</div>
            <div className="text-xs text-[#aca3bd] mb-2">{twoDegreesSuggestion.role}</div>
            {twoDegreesSuggestion.one_liner && (
              <p className="text-xs text-[#cf8a5e] mb-2">{twoDegreesSuggestion.one_liner}</p>
            )}
            <a href={`/chats/${twoDegreesSuggestion.id}`} className="text-xs font-semibold text-[#cf8a5e]">→ Say hi</a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      <BottomNav />
    </main>
  );
}
