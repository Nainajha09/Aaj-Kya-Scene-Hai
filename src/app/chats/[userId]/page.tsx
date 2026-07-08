import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "./MessageThread";

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
    .select("id, name, role")
    .eq("id", userId)
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
    <main className="min-h-screen bg-[#16151d] text-[#efe9dd] p-6 flex flex-col">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        <a href="/chats" className="text-xs text-[#aca3bd] mb-3">
          ← Back to Chats
        </a>
        <h1 className="text-xl font-bold mb-1">
          {otherPerson?.name || "Unknown"}
        </h1>
        <p className="text-xs text-[#aca3bd] mb-6">{otherPerson?.role}</p>

        <MessageThread
          myId={user.id}
          otherId={userId}
          initialMessages={messages ?? []}
        />
      </div>
    </main>
  );
}
