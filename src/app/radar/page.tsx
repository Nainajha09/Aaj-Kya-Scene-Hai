import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RadarList from "./RadarList";
import BottomNav from "@/components/BottomNav";

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

  const { data: activeCheckins } = await supabase
    .from("checkins")
    .select("scene_id, user_id")
    .is("left_at", null);

  const myCheckins = (activeCheckins ?? [])
    .filter((c) => c.user_id === user.id)
    .map((c) => c.scene_id);

  const countByScene: Record<number, number> = {};
  (activeCheckins ?? []).forEach((c) => {
    countByScene[c.scene_id] = (countByScene[c.scene_id] ?? 0) + 1;
  });

  return (
    <main className="min-h-screen bg-[#16151d] text-[#efe9dd] p-6 pb-20">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-1">Scene Radar</h1>
        <p className="text-sm text-[#aca3bd] mb-6">
          What&apos;s happening near you, right now.
        </p>
        <RadarList
          scenes={scenes ?? []}
          countByScene={countByScene}
          myCheckins={myCheckins}
        />
      </div>
      <BottomNav />
    </main>
  );
}
