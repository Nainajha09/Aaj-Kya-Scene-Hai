"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { levelFor, nextLevel } from "@/lib/levels";

type Profile = {
  id: string;
  name: string;
  role: string;
  obsession: string;
  one_liner: string;
  score: number;
  avatar_url: string | null;
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
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const score = initialProfile?.score ?? 0;
  const level = levelFor(score);
  const next = nextLevel(score);
  const progress = next
    ? Math.min(100, Math.round(((score - level.min) / (next.min - level.min)) * 100))
    : 100;

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !initialProfile) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    setUploadError("");

    const ext = file.name.split(".").pop();
    const path = `${initialProfile.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so the new photo shows immediately instead of a
    // browser-cached version of the old one at the same URL.
    const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: freshUrl })
      .eq("id", initialProfile.id);

    if (dbErr) {
      setUploadError(dbErr.message);
      setUploading(false);
      return;
    }

    setAvatarUrl(freshUrl);
    setUploading(false);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!initialProfile) return;
    setSaving(true);
    setSaved(false);
    await supabase.from("profiles").update(form).eq("id", initialProfile.id);
    setSaving(false);
    setSaved(true);
    // Briefly show "Saved ✓" so it doesn't feel like the page just
    // vanished, then head to the Scene feed.
    setTimeout(() => {
      router.push("/feed");
    }, 600);
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
      <div className="rounded-2xl bg-[#221f38] border border-white/5 p-5 text-center">
        <div className="relative w-20 h-20 mx-auto mb-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Your profile photo"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-[#1e1830]"
              style={{ background: "linear-gradient(135deg, #b298e7, #f5b8d5)" }}
            >
              {initial}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#b298e7] text-[#1e1830] flex items-center justify-center text-xs border-2 border-[#221f38] disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {uploading ? "…" : "📷"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
        {uploadError && <p className="text-xs text-[#ef7fa8] mb-2">{uploadError}</p>}

        <div className="font-bold text-lg">{form.name || "Unnamed Scene-ster"}</div>
        <div className="text-xs text-[#b6abd9] mb-2">{form.role || "Add your role"}</div>
        <p className="text-sm mb-4">{form.one_liner || "Your one-line vibe goes here."}</p>

        <div className="text-left">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-[#b298e7]">{level.name}</span>
            <span className="text-[#b6abd9] font-mono">{score} pts</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #b298e7, #f5b8d5)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
            Name
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="What do people call you?"
            className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
            Role
          </label>
          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Growth Marketer"
            className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
            Current obsession
          </label>
          <input
            value={form.obsession}
            onChange={(e) => setForm({ ...form, obsession: e.target.value })}
            placeholder="e.g. cold brew, F1, my side project"
            className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
            One-line vibe
          </label>
          <input
            value={form.one_liner}
            onChange={(e) => setForm({ ...form, one_liner: e.target.value })}
            placeholder="Your one-line vibe"
            className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7]"
          />
        </div>

        <button
          type="button"
          onClick={generateBio}
          disabled={generating || !form.role.trim()}
          className="w-full rounded-lg border border-white/10 text-[#b6abd9] font-semibold py-2.5 text-xs disabled:opacity-50"
        >
          {generating ? "Writing..." : "✨ Generate my vibe bio"}
        </button>

        <button
          disabled={saving}
          className="w-full rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
