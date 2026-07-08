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

  // Everyone except yourself — good enough for early testing.
  // Once there are real users, this is where you'd instead show
  // "people you've checked into a scene with."
  const { data: people } = await supabase
    .from("profiles")
    .select("id, name, role, one_liner")
    .neq("id", user.id);

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
          {(people ?? []).map((p) => (
            <a
              key={p.id}
              href={`/chats/${p.id}`}
              className="block rounded-2xl bg-[#1f1d27] border border-white/5 p-4"
            >
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
            </a>
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
