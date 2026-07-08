import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import BottomNav from "@/components/BottomNav";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: joinedScenes } = await supabase
    .from("checkins")
    .select("scene_id, scenes(name, tag)")
    .eq("user_id", user.id)
    .is("left_at", null);

  return (
    <main className="min-h-screen bg-[#15132a] text-[#f3eefb] p-6 pb-20">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Your Scene</h1>
          <a
            href="/guide"
            className="text-xs font-semibold text-[#b298e7] bg-[#b298e7]/10 border border-[#b298e7]/30 rounded-full px-3 py-1.5 flex-shrink-0"
          >
            📖 How it works
          </a>
        </div>
        <p className="text-sm text-[#b6abd9] mb-6">{user.email}</p>
        <ProfileForm initialProfile={profile} />

        <div className="rounded-2xl bg-[#221f38] border border-white/5 p-4 mt-4">
          <div className="text-xs uppercase tracking-wide text-[#b6abd9] mb-2">
            Scenes you&apos;ve joined
          </div>
          {(!joinedScenes || joinedScenes.length === 0) && (
            <p className="text-sm text-[#b6abd9]">
              None yet — check Radar and join one.
            </p>
          )}
          <div className="space-y-2">
            {(joinedScenes ?? []).map((c) => {
              const scene = Array.isArray(c.scenes) ? c.scenes[0] : c.scenes;
              return (
                <div key={c.scene_id} className="text-sm flex items-center gap-2">
                  <span>☕</span>
                  <span>{scene?.name ?? "Unknown scene"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
