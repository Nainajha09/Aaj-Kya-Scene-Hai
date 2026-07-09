import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import TourOverlay from "@/components/TourOverlay";
import Avatar from "@/components/Avatar";

export default async function ChatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Everyone except yourself — good enough for early testing.
  // Once there are real users, this is where you'd instead show
  // "people you've checked into a scene with."
  const { data: people } = await supabase
    .from("profiles")
    .select("id, name, role, one_liner, avatar_url")
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

  // Named, real-looking profiles first — people who haven't finished
  // onboarding (no name set) get pushed to the bottom instead of
  // being scattered throughout the list.
  const sortedPeople = [...(people ?? [])].sort((a, b) => {
    const aHasName = a.name?.trim() ? 1 : 0;
    const bHasName = b.name?.trim() ? 1 : 0;
    if (aHasName !== bHasName) return bHasName - aHasName;
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <main className="min-h-screen bg-[#15132a] text-[#f3eefb] p-6 pb-20">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-1">Chats</h1>
        <p className="text-sm text-[#b6abd9] mb-6">
          Real conversations, not cold DMs.
        </p>

        {(!sortedPeople || sortedPeople.length === 0) && (
          <p className="text-sm text-[#b6abd9]">
            No one else has signed up yet — invite someone to test this with!
          </p>
        )}

        <div className="space-y-3">
          {sortedPeople.map((p) => {
            const unread = unreadBySender[p.id] ?? 0;
            return (
              <a
                key={p.id}
                href={`/chats/${p.id}`}
                className="flex items-center justify-between rounded-2xl bg-[#221f38] border border-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} avatarUrl={p.avatar_url} size={40} />
                  <div>
                    <div className="font-bold text-[15px]">
                      {p.name || "Unnamed Scene-ster"}
                    </div>
                    <div className="text-xs text-[#b6abd9]">
                      {p.role || "No role set"}
                    </div>
                    {p.one_liner && (
                      <div className="text-xs text-[#b298e7] mt-1">
                        {p.one_liner}
                      </div>
                    )}
                  </div>
                </div>
                {unread > 0 && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#b298e7] text-[#1e1830] text-[11px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>
      <BottomNav />
      <TourOverlay />
    </main>
  );
}
