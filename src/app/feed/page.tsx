import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import DailyReport from "./DailyReport";

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

  const [
    { data: recentCheckins },
    { count: liveScenesCount },
    { count: activeCheckinsCount },
    { count: totalUsers },
    { data: popupScenes },
    { data: otherProfiles },
  ] = await Promise.all([
    supabase
      .from("checkins")
      .select("joined_at, profiles(name), scenes(name)")
      .order("joined_at", { ascending: false })
      .limit(10),
    supabase.from("scenes").select("*", { count: "exact", head: true }).eq("is_live", true),
    supabase.from("checkins").select("*", { count: "exact", head: true }).is("left_at", null),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("scenes")
      .select("*")
      .in("tag", ["Pop-up Scene", "Party"])
      .eq("is_live", true)
      .limit(1),
    supabase.from("profiles").select("id, name, role, one_liner").neq("id", user.id).limit(5),
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

        <DailyReport
          liveScenes={liveScenesCount ?? 0}
          activeCheckins={activeCheckinsCount ?? 0}
          totalUsers={totalUsers ?? 0}
        />

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
            <a
              href={`/chats/${twoDegreesSuggestion.id}`}
              className="text-xs font-semibold text-[#cf8a5e]"
            >
              → Say hi
            </a>
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
