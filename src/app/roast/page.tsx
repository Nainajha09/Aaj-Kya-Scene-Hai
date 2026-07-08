"use client";

import { useState, type FormEvent } from "react";
import BottomNav from "@/components/BottomNav";

export default function RoastPage() {
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function roast(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data.result);
    } catch {
      setError("Couldn't reach the roast machine. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#15132a] text-[#f3eefb] p-6 pb-20">
      <div className="max-w-sm mx-auto">
        <a href="/profile" className="text-xs text-[#b6abd9] mb-3 inline-block">
          ← Back to Profile
        </a>
        <h1 className="text-2xl font-bold mb-1">🔥 Roast My Career</h1>
        <p className="text-sm text-[#b6abd9] mb-6">
          Brutally honest. Weirdly useful. Screenshot-worthy.
        </p>

        <form onSubmit={roast} className="space-y-3 mb-6">
          <div>
            <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
              Current role
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Product Manager, 2nd job"
              className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7]"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
              Your career so far, in a few lines
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="e.g. Switched from marketing to product, still finishing an MBA I started 3 years ago..."
              className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7] resize-y"
            />
          </div>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Roasting..." : "Roast me 🔥"}
          </button>
        </form>

        {error && <p className="text-sm text-[#ef7fa8] mb-4">{error}</p>}

        {result && (
          <div className="rounded-2xl bg-[#221f38] border border-[#b298e7]/30 p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {result}
            </pre>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}