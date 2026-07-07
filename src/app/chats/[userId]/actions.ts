"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(receiverId: string, text: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };
  if (!text.trim()) return { error: "Message can't be empty" };

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    text: text.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath(`/chats/${receiverId}`);
  return { error: null };
}
