import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RadarList from "./RadarList";
import BottomNav from "@/components/BottomNav";

export type Attendee = { name: string; role: string };
export type Scene = {
  id: number;
  name: string;
  tag: string;
  lat: number;
  lng: number;
  vibe: string | null;
  is_live: boolean;
};

export default async function RadarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scenes } = await supabase
    .from("scenes")
    .select("*")
    .order("id");

  // Real attendee data — joins checkins to profiles, so the people
  // shown are whoever has actually checked into that scene.
  const { data: activeCheckins } = await supabase
    .from("checkins")
    .select("scene_id, user_id, profiles(name, role)")
    .is("left_at", null);

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
        { name: profile.name || "Someone", role: profile.role || "" },
      ];
    }
  });

  return (
    <main className="min-h-screen bg-[#16151d] text-[#efe9dd] p-6 pb-20">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-1">Scene Radar</h1>
        <p className="text-sm text-[#aca3bd] mb-6">
          What&apos;s happening near you, right now.
        </p>
        <RadarList
          scenes={(scenes as Scene[]) ?? []}
          countByScene={countByScene}
          attendeesByScene={attendeesByScene}
          myCheckins={myCheckins}
        />
      </div>
      <BottomNav />
    </main>
  );
}
