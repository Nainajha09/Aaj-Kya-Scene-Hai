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

export async function createScene(input: {
  name: string;
  tag: string;
  lat: number;
  lng: number;
  vibe?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  if (!input.name.trim()) return { error: "Give the scene a name." };

  const { data: scene, error } = await supabase
    .from("scenes")
    .insert({
      name: input.name.trim(),
      tag: input.tag,
      lat: input.lat,
      lng: input.lng,
      vibe: input.vibe?.trim() || null,
      is_live: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Auto check-in the creator since they're presumably right there.
  if (scene) {
    await supabase.from("checkins").insert({ user_id: user.id, scene_id: scene.id });
  }

  revalidatePath("/radar");
  revalidatePath("/feed");
  return { error: null };
}

export async function updateScene(
  sceneId: number,
  input: { name: string; tag: string; vibe?: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  if (!input.name.trim()) return { error: "Give the scene a name." };

  // RLS also enforces this, but checking here gives a clearer error
  // message than a silent no-op update.
  const { data: scene } = await supabase
    .from("scenes")
    .select("created_by")
    .eq("id", sceneId)
    .single();

  if (!scene || scene.created_by !== user.id) {
    return { error: "You can only edit scenes you created." };
  }

  const { error } = await supabase
    .from("scenes")
    .update({
      name: input.name.trim(),
      tag: input.tag,
      vibe: input.vibe?.trim() || null,
    })
    .eq("id", sceneId);

  if (error) return { error: error.message };
  revalidatePath("/radar");
  revalidatePath("/feed");
  return { error: null };
}

export async function deleteScene(sceneId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: scene } = await supabase
    .from("scenes")
    .select("created_by")
    .eq("id", sceneId)
    .single();

  if (!scene || scene.created_by !== user.id) {
    return { error: "You can only delete scenes you created." };
  }

  const { error } = await supabase.from("scenes").delete().eq("id", sceneId);

  if (error) return { error: error.message };
  revalidatePath("/radar");
  revalidatePath("/feed");
  return { error: null };
}