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

type Profile = { role: string; obsession: string };
type OtherProfile = Profile & { name: string; oneLiner: string };

export default function MessageThread({
  myId,
  otherId,
  initialMessages,
  otherProfile,
  myProfile,
}: {
  myId: string;
  otherId: string;
  initialMessages: Message[];
  otherProfile: OtherProfile;
  myProfile: Profile;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
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

  async function draftIcebreaker() {
    setDrafting(true);
    setDraftError("");
    try {
      const res = await fetch("/api/icebreaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherName: otherProfile.name,
          otherRole: otherProfile.role,
          otherOneLiner: otherProfile.oneLiner,
          otherObsession: otherProfile.obsession,
          myRole: myProfile.role,
          myObsession: myProfile.obsession,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setInput(data.result);
      } else {
        setDraftError(data.error || "Couldn't draft anything. Try again.");
      }
    } catch {
      setDraftError("Something went wrong. Try again.");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[300px]">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-[#b6abd9] mb-3">
              No messages yet — break the ice.
            </p>
            <button
              onClick={draftIcebreaker}
              disabled={drafting}
              className="text-xs font-semibold text-[#b298e7] border border-[#b298e7]/30 rounded-full px-4 py-2 disabled:opacity-60"
            >
              {drafting ? "Thinking..." : "✨ Suggest an icebreaker"}
            </button>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.sender_id === myId
                ? "ml-auto max-w-[80%] bg-[#b298e7] text-[#1e1830] rounded-2xl rounded-br-sm px-4 py-2 text-sm w-fit"
                : "mr-auto max-w-[80%] bg-[#221f38] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-2 text-sm w-fit"
            }
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length > 0 && (
        <button
          onClick={draftIcebreaker}
          disabled={drafting}
          className="self-start text-xs font-semibold text-[#b6abd9] mb-2 disabled:opacity-60"
        >
          {drafting ? "Thinking..." : "✨ Draft a message with AI"}
        </button>
      )}
      {draftError && <p className="text-xs text-[#ef7fa8] mb-2">{draftError}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7]"
        />
        <button
          disabled={sending}
          className="rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold px-4 py-3 text-sm disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </>
  );
}
