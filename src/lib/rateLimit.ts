import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks whether a user is still within their allowed number of calls
 * to a given AI feature in the last `windowMinutes`. If allowed, it
 * also records this call so the next check sees it.
 *
 * Returns true if the call should proceed, false if the limit was hit.
 */
export async function checkAndRecordUsage(
  supabase: SupabaseClient,
  userId: string,
  route: string,
  limit: number,
  windowMinutes: number
): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMinutes * 60000).toISOString();

  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("route", route)
    .gte("created_at", cutoff);

  if ((count ?? 0) >= limit) {
    return false;
  }

  await supabase.from("ai_usage").insert({ user_id: userId, route });
  return true;
}