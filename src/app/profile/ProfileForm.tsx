"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!initialProfile) return;
    setSaving(true);
    setSaved(false);
    await supabase.from("profiles").update(form).eq("id", initialProfile.id);
    setSaving(false);
    setSaved(true);
  }

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "obsession", label: "Current obsession" },
    { key: "one_liner", label: "One-line vibe" },
  ];

  return (
    <form onSubmit={save} className="space-y-3">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-xs uppercase tracking-wide text-[#aca3bd] mb-1">
            {label}
          </label>
          <input
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="w-full rounded-lg bg-[#1f1d27] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#cf8a5e]"
          />
        </div>
      ))}

      <button
        disabled={saving}
        className="w-full rounded-lg bg-[#cf8a5e] text-[#1a1108] font-semibold py-3 text-sm disabled:opacity-60"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save profile"}
      </button>

      {initialProfile && (
        <p className="text-center text-xs text-[#aca3bd] pt-1">
          Scene Score: {initialProfile.score}
        </p>
      )}
    </form>
  );
}
