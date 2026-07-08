import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RadarList from "./RadarList";
import BottomNav from "@/components/BottomNav";

export type Attendee = { name: string; role: string; avatarUrl: string | null };
export type Scene = {
  id: number;
  name: string;
  tag: string;
  lat: number;
  lng: number;
  vibe: string | null;
  is_live: boolean;
  created_by: string | null;
  starts_at: string;
  ends_at: string | null;
};
export type InvitablePerson = { id: string; name: string; avatar_url: string | null };

export default async function RadarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nowIso = new Date().toISOString();

  const [{ data: scenes }, { data: activeCheckins }, { data: people }] = await Promise.all([
    supabase
      .from("scenes")
      .select("id, name, tag, lat, lng, vibe, is_live, created_by, starts_at, ends_at")
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .order("starts_at", { ascending: true }),
    supabase
      .from("checkins")
      .select("scene_id, user_id, profiles(name, role, avatar_url)")
      .is("left_at", null),
    supabase.from("profiles").select("id, name, avatar_url").neq("id", user.id),
  ]);

  const myCheckins = (activeCheckins ?? [])
    .filter((c) => c.user_id === user.id)
    .map((c) => c.scene_id);

  const countByScene: Record<number, number> = {};
  const attendeesByScene: Record<number, Attendee[]> = {};

  (activeCheckins ?? []).forEach((c) => {
    countByScene[c.scene_id] = (countByScene[c.scene_id] ?? 0) + 1;
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    if (profile) {
      attendeesByScene[c.scene_id] = [
        ...(attendeesByScene[c.scene_id] ?? []),
        {
          name: profile.name || "Someone",
          role: profile.role || "",
          avatarUrl: profile.avatar_url || null,
        },
      ];
    }
  });

  return (
    <main className="min-h-screen bg-[#15132a] text-[#f3eefb] p-6 pb-20">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-1">Scene Radar</h1>
        <p className="text-sm text-[#b6abd9] mb-6">
          What&apos;s happening near you, right now.
        </p>
        <RadarList
          scenes={(scenes as Scene[]) ?? []}
          countByScene={countByScene}
          attendeesByScene={attendeesByScene}
          myCheckins={myCheckins}
          currentUserId={user.id}
          invitablePeople={(people as InvitablePerson[]) ?? []}
        />
      </div>
      <BottomNav />
    </main>
  );
}
