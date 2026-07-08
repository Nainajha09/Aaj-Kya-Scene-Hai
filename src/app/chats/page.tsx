import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export default async function ChatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Everyone except yourself good enough for early testing.
  // Once there are real users, this is where you'd instead show
  // "people you've checked into a scene with."
  const { data: people } = await supabase
    .from("profiles")
    .select("id, name, role, one_liner")
    .neq("id", user.id);

  // Unread messages sent TO me, grouped by who sent them.
  const { data: unreadMessages } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", user.id)
    .is("read_at", null);

  const unreadBySender: Record<string, number> = {};
  (unreadMessages ?? []).forEach((m) => {
    unreadBySender[m.sender_id] = (unreadBySender[m.sender_id] ?? 0) + 1;
  });

  return (
    <main className="min-h-screen bg-[#16151d] text-[#efe9dd] p-6 pb-20">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-1">Chats</h1>
        <p className="text-sm text-[#aca3bd] mb-6">
          Real conversations, not cold DMs.
        </p>

        {(!people || people.length === 0) && (
          <p className="text-sm text-[#aca3bd]">
            No one else has signed up yet — invite someone to test this with!
          </p>
        )}

        <div className="space-y-3">
          {(people ?? []).map((p) => {
            const unread = unreadBySender[p.id] ?? 0;
            return (
              <a
                key={p.id}
                href={`/chats/${p.id}`}
                className="flex items-center justify-between rounded-2xl bg-[#1f1d27] border border-white/5 p-4"
              >
                <div>
                  <div className="font-bold text-[15px]">
                    {p.name || "Unnamed Scene-ster"}
                  </div>
                  <div className="text-xs text-[#aca3bd]">
                    {p.role || "No role set"}
                  </div>
                  {p.one_liner && (
                    <div className="text-xs text-[#cf8a5e] mt-1">
                      {p.one_liner}
                    </div>
                  )}
                </div>
                {unread > 0 && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#cf8a5e] text-[#1a1108] text-[11px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
