"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function joinScene(sceneId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from("checkins")
    .insert({ user_id: user.id, scene_id: sceneId });

  if (error) return { error: error.message };

  // Award 10 Scene Score points for joining. This reads the current
  // score first rather than blindly incrementing, so two rapid clicks
  // can't silently double-count.
  const { data: profile } = await supabase
    .from("profiles")
    .select("score")
    .eq("id", user.id)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ score: profile.score + 10 })
      .eq("id", user.id);
  }

  revalidatePath("/radar");
  revalidatePath("/profile");
  return { error: null };
}

export async function leaveScene(sceneId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from("checkins")
    .update({ left_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("scene_id", sceneId)
    .is("left_at", null);

  if (error) return { error: error.message };
  revalidatePath("/radar");
  return { error: null };
}
