"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendOtp(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return { error: error.message };
  return { error: null };
}

export async function verifyOtpCode(email: string, token: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { error: error.message };
  return { error: null };
}