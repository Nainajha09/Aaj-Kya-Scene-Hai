"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "./actions";

type Message = {
  id: number;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
};

export default function MessageThread({
  myId,
  otherId,
  initialMessages,
}: {
  myId: string;
  otherId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Listen for new messages in real time so both people see them
  // instantly without refreshing the page.
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${[myId, otherId].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          const isRelevant =
            (m.sender_id === myId && m.receiver_id === otherId) ||
            (m.sender_id === otherId && m.receiver_id === myId);
          if (isRelevant) {
            setMessages((prev) =>
              prev.some((p) => p.id === m.id) ? prev : [...prev, m]
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, otherId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input;
    setInput("");
    await sendMessage(otherId, text);
    setSending(false);
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[300px]">
        {messages.length === 0 && (
          <p className="text-xs text-[#aca3bd]">Say hi 👋</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.sender_id === myId
                ? "ml-auto max-w-[80%] bg-[#cf8a5e] text-[#1a1108] rounded-2xl rounded-br-sm px-4 py-2 text-sm w-fit"
                : "mr-auto max-w-[80%] bg-[#1f1d27] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-2 text-sm w-fit"
            }
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#cf8a5e]"
        />
        <button
          disabled={sending}
          className="rounded-lg bg-[#cf8a5e] text-[#1a1108] font-semibold px-4 py-3 text-sm disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </>
  );
}
