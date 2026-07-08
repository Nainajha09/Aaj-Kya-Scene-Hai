import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import DailyReport from "./DailyReport";
import Avatar from "@/components/Avatar";
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
    supabase.from("profiles").select("id, name, role, one_liner, avatar_url").neq("id", user.id).limit(5),
    supabase.from("profiles").select("id, name, role, score, avatar_url").order("score", { ascending: false }).limit(5),
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

  // Scene of the Week — whichever scene had the most check-ins in the
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
    <main className="min-h-screen bg-[#15132a] text-[#f3eefb] pb-20">
      {/* Ticker */}
      <div className="bg-[#100e1c] border-b border-white/5 overflow-hidden whitespace-nowrap py-2">
        {tickerItems.length > 0 ? (
          <div className="inline-flex animate-[scroll_30s_linear_infinite]">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="text-[11px] font-mono text-[#b6abd9] px-5">
                {t} <span className="opacity-30">●</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-[#b6abd9] px-5">
            No activity yet — go check into a scene to get things moving.
          </span>
        )}
      </div>

      <div className="max-w-sm mx-auto p-6">
        <h1 className="text-2xl font-bold mb-1">Aaj Kya Scene Hai</h1>
        <p className="text-sm text-[#b6abd9] mb-6">What&apos;s happening right now.</p>

        <DailyReport />

        {sceneOfWeek && (
          <div className="rounded-2xl bg-[#221f38] border border-white/5 p-4 mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#8fe3e9] mb-1">
              🔥 Scene of the Week
            </div>
            <div className="font-bold text-[15px] mb-1">{sceneOfWeek.name}</div>
            <div className="text-xs text-[#b6abd9]">
              {sceneOfWeek.count} check-in{sceneOfWeek.count === 1 ? "" : "s"} this week
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[#221f38] border border-white/5 p-4 mt-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#b298e7] mb-3">
            🏆 Scene Leaderboard
          </div>
          <div className="space-y-3">
            {(topProfiles ?? []).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-5 text-xs font-mono text-[#b6abd9]">#{i + 1}</div>
                <Avatar name={p.name || "?"} avatarUrl={p.avatar_url} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {p.name || "Unnamed"} {p.id === user.id && "(you)"}
                  </div>
                  <div className="text-[11px] text-[#b6abd9]">{levelFor(p.score).name}</div>
                </div>
                <div className="text-xs font-mono text-[#b298e7]">{p.score}</div>
              </div>
            ))}
            {(!topProfiles || topProfiles.length === 0) && (
              <p className="text-sm text-[#b6abd9]">No one's scored points yet.</p>
            )}
          </div>
          {myRank && (
            <div className="text-xs text-[#b6abd9] mt-3 pt-3 border-t border-white/5">
              You&apos;re ranked #{myRank} with {myScore} points.
            </div>
          )}
        </div>

        {popupScenes && popupScenes.length > 0 && (
          <div className="rounded-2xl bg-[#221f38] border border-white/5 p-4 mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#8fe3e9] mb-1">
              Pop-up Scene
            </div>
            <div className="font-bold text-[15px] mb-2">{popupScenes[0].name}</div>
            <a href="/radar" className="text-xs font-semibold text-[#b298e7]">
              → Check it out on Radar
            </a>
          </div>
        )}

        {twoDegreesSuggestion && (
          <div className="rounded-2xl bg-[#221f38] border border-white/5 p-4 mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#f5b8d5] mb-1">
              Someone to meet
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Avatar name={twoDegreesSuggestion.name || "Someone"} avatarUrl={twoDegreesSuggestion.avatar_url} size={36} />
              <div>
                <div className="font-bold text-[15px]">{twoDegreesSuggestion.name || "Someone"}</div>
                <div className="text-xs text-[#b6abd9]">{twoDegreesSuggestion.role}</div>
              </div>
            </div>
            {twoDegreesSuggestion.one_liner && (
              <p className="text-xs text-[#b298e7] mb-2">{twoDegreesSuggestion.one_liner}</p>
            )}
            <a href={`/chats/${twoDegreesSuggestion.id}`} className="text-xs font-semibold text-[#b298e7]">→ Say hi</a>
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
