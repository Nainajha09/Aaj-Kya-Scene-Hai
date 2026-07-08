"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import BottomNav from "@/components/BottomNav";

type Msg = { role: "user" | "assistant"; content: string };

export default function ConciergePage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Heyyy 👋 I'm your Scene Concierge. Tell me a goal — like 'meet fintech PMs' or 'find a design mentor' — and I'll help you work the room.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.result || data.error || "..." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Signal dropped for a sec — try again?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#16151d] text-[#efe9dd] p-6 pb-20 flex flex-col">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        <a href="/profile" className="text-xs text-[#aca3bd] mb-3">
          ← Back to Profile
        </a>
        <h1 className="text-2xl font-bold mb-1">Scene Concierge</h1>
        <p className="text-sm text-[#aca3bd] mb-6">
          Your AI wingman for actually meeting people.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[300px]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] bg-[#cf8a5e] text-[#1a1108] rounded-2xl rounded-br-sm px-4 py-2 text-sm w-fit"
                  : "mr-auto max-w-[85%] bg-[#1f1d27] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-2 text-sm w-fit"
              }
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="mr-auto max-w-[85%] bg-[#1f1d27] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-2 text-sm w-fit text-[#aca3bd]">
              thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. I want to meet early-stage founders"
            className="flex-1 rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#cf8a5e]"
          />
          <button
            disabled={loading}
            className="rounded-lg bg-[#cf8a5e] text-[#1a1108] font-semibold px-4 py-3 text-sm disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>
      <BottomNav />
    </main>
  );
}
