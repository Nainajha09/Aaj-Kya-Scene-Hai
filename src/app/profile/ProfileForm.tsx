"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { levelFor, nextLevel } from "@/lib/levels";

type Profile = {
  id: string;
  name: string;
  role: string;
  obsession: string;
  one_liner: string;
  score: number;
};

export default function ProfileForm({
  initialProfile,
}: {
  initialProfile: Profile | null;
}) {
  const [form, setForm] = useState({
    name: initialProfile?.name ?? "",
    role: initialProfile?.role ?? "",
    obsession: initialProfile?.obsession ?? "",
    one_liner: initialProfile?.one_liner ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();

  const score = initialProfile?.score ?? 0;
  const level = levelFor(score);
  const next = nextLevel(score);
  const progress = next
    ? Math.min(100, Math.round(((score - level.min) / (next.min - level.min)) * 100))
    : 100;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!initialProfile) return;
    setSaving(true);
    setSaved(false);
    await supabase.from("profiles").update(form).eq("id", initialProfile.id);
    setSaving(false);
    setSaved(true);
  }

  async function generateBio() {
    if (!form.role.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: form.role, obsession: form.obsession }),
      });
      const data = await res.json();
      if (data.result) {
        setForm((f) => ({ ...f, one_liner: data.result }));
      }
    } catch {
      // silently fail — the field just stays as-is
    } finally {
      setGenerating(false);
    }
  }

  const initial = (form.name || "?").slice(0, 1).toUpperCase();

  return (
    <div className="space-y-4">
      {/* Avatar + level card */}
      <div className="rounded-2xl bg-[#1f1d27] border border-white/5 p-5 text-center">
        <div
          className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-[#1a1108]"
          style={{ background: "linear-gradient(135deg, #cf8a5e, #b5657f)" }}
        >
          {initial}
        </div>
        <div className="font-bold text-lg">{form.name || "Unnamed Scene-ster"}</div>
        <div className="text-xs text-[#aca3bd] mb-2">{form.role || "Add your role"}</div>
        <p className="text-sm mb-4">{form.one_liner || "Your one-line vibe goes here."}</p>

        <div className="text-left">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-[#cf8a5e]">{level.name}</span>
            <span className="text-[#aca3bd] font-mono">{score} pts</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #cf8a5e, #b5657f)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#aca3bd] mb-1">
            Name
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="What do people call you?"
            className="w-full rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#cf8a5e]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#aca3bd] mb-1">
            Role
          </label>
          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Growth Marketer"
            className="w-full rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#cf8a5e]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#aca3bd] mb-1">
            Current obsession
          </label>
          <input
            value={form.obsession}
            onChange={(e) => setForm({ ...form, obsession: e.target.value })}
            placeholder="e.g. cold brew, F1, my side project"
            className="w-full rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#cf8a5e]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#aca3bd] mb-1">
            One-line vibe
          </label>
          <input
            value={form.one_liner}
            onChange={(e) => setForm({ ...form, one_liner: e.target.value })}
            placeholder="Your one-line vibe"
            className="w-full rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#cf8a5e]"
          />
        </div>

        <button
          type="button"
          onClick={generateBio}
          disabled={generating || !form.role.trim()}
          className="w-full rounded-lg border border-white/10 text-[#aca3bd] font-semibold py-2.5 text-xs disabled:opacity-50"
        >
          {generating ? "Writing..." : "✨ Generate my vibe bio"}
        </button>

        <button
          disabled={saving}
          className="w-full rounded-lg bg-[#cf8a5e] text-[#1a1108] font-semibold py-3 text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
