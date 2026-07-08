import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "./MessageThread";
import Avatar from "@/components/Avatar";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: otherPerson } = await supabase
    .from("profiles")
    .select("id, name, role, one_liner, obsession, avatar_url")
    .eq("id", userId)
    .single();

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role, obsession")
    .eq("id", user.id)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  // Mark any messages this person sent me as read, now that I've
  // opened the thread and actually seen them.
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", userId)
    .eq("receiver_id", user.id)
    .is("read_at", null);

  return (
    <main className="min-h-screen bg-[#15132a] text-[#f3eefb] p-6 flex flex-col">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        <a href="/chats" className="text-xs text-[#b6abd9] mb-3">
          ← Back to Chats
        </a>
        <div className="flex items-center gap-3 mb-6">
          <Avatar name={otherPerson?.name ?? ""} avatarUrl={otherPerson?.avatar_url} size={44} />
          <div>
            <h1 className="text-xl font-bold">{otherPerson?.name || "Unknown"}</h1>
            <p className="text-xs text-[#b6abd9]">{otherPerson?.role}</p>
          </div>
        </div>

        <MessageThread
          myId={user.id}
          otherId={userId}
          initialMessages={messages ?? []}
          otherProfile={{
            name: otherPerson?.name ?? "",
            role: otherPerson?.role ?? "",
            oneLiner: otherPerson?.one_liner ?? "",
            obsession: otherPerson?.obsession ?? "",
          }}
          myProfile={{
            role: myProfile?.role ?? "",
            obsession: myProfile?.obsession ?? "",
          }}
        />
      </div>
    </main>
  );
}
