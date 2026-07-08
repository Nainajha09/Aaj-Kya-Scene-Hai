"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [obsession, setObsession] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // If this person already has a name set, they've onboarded before —
  // send them straight to the app instead of showing this again.
  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      if (profile?.name) {
        router.replace("/feed");
        return;
      }
      setChecking(false);
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateBio() {
    if (!role.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, obsession }),
      });
      const data = await res.json();
      if (data.result) setOneLiner(data.result);
    } catch {
      // silently fail — field just stays empty, they can type their own
    } finally {
      setGenerating(false);
    }
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setUploading(true);
    setError("");
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }
    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(`${publicUrlData.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  }

  async function finish() {
    if (!userId) return;
    setSaving(true);
    setError("");
    const { error: saveErr } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        role: role.trim(),
        obsession: obsession.trim(),
        one_liner: oneLiner.trim(),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", userId);
    setSaving(false);
    if (saveErr) {
      setError(saveErr.message);
      return;
    }
    router.push("/feed");
  }

  function next() {
    setError("");
    if (step === 1 && !name.trim()) {
      setError("Tell us what to call you.");
      return;
    }
    if (step === 2 && !role.trim()) {
      setError("What do you do? Even roughly is fine.");
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-[#15132a] text-[#f3eefb] flex items-center justify-center">
        <p className="text-sm text-[#b6abd9]">Setting things up...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#15132a] text-[#f3eefb] flex flex-col p-6">
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center mb-8 mt-4">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-6 bg-[#b298e7]" : i < step ? "w-1.5 bg-[#b298e7]/60" : "w-1.5 bg-white/10"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        {step === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-2">Welcome to the Scene</h1>
            <p className="text-sm text-[#b6abd9] mb-8">
              Aaj Kya Scene Hai isn&apos;t another networking app where you fill out a
              résumé and wait. Let&apos;s set your vibe up in under a minute, then
              you&apos;re straight into what&apos;s happening around you.
            </p>
            <button
              onClick={next}
              className="w-full rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm"
            >
              Let&apos;s go →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-1">What should people call you?</h2>
            <p className="text-xs text-[#b6abd9] mb-5">
              First name is perfect — this is how others will see you.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="e.g. Naina"
              className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
            />
            {error && <p className="text-xs text-[#ef7fa8] mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={back}
                className="flex-1 rounded-lg border border-white/10 text-[#b6abd9] font-semibold py-3 text-sm"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-1 rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-1">What do you do?</h2>
            <p className="text-xs text-[#b6abd9] mb-5">
              Your role, roughly — you can always change this later.
            </p>
            <input
              autoFocus
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="e.g. Product Designer"
              className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
            />
            {error && <p className="text-xs text-[#ef7fa8] mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={back}
                className="flex-1 rounded-lg border border-white/10 text-[#b6abd9] font-semibold py-3 text-sm"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-1 rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-1">What are you into right now?</h2>
            <p className="text-xs text-[#b6abd9] mb-5">
              A hobby, a show, a random obsession — this is what makes conversations happen.
            </p>
            <input
              autoFocus
              value={obsession}
              onChange={(e) => setObsession(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="e.g. F1, cold brew, my side project"
              className="w-full rounded-lg bg-[#221f38] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
            />

            <button
              type="button"
              onClick={generateBio}
              disabled={generating || !role.trim()}
              className="w-full rounded-lg border border-white/10 text-[#b6abd9] font-semibold py-2.5 text-xs mb-1 disabled:opacity-50"
            >
              {generating ? "Writing..." : "✨ Let AI write my one-liner"}
            </button>
            {oneLiner && (
              <p className="text-xs text-[#b298e7] bg-[#b298e7]/10 rounded-lg px-3 py-2 mt-2 mb-1">
                {oneLiner}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={back}
                className="flex-1 rounded-lg border border-white/10 text-[#b6abd9] font-semibold py-3 text-sm"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-1 rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1">Add a photo?</h2>
            <p className="text-xs text-[#b6abd9] mb-5">
              Totally optional — helps people recognize you at a scene.
            </p>

            <div className="relative w-24 h-24 mx-auto mb-5">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Your profile photo"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-[#1e1830]"
                  style={{ background: "linear-gradient(135deg, #b298e7, #f5b8d5)" }}
                >
                  {(name || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#b298e7] text-[#1e1830] flex items-center justify-center text-sm border-2 border-[#15132a] disabled:opacity-60"
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

            {error && <p className="text-xs text-[#ef7fa8] mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={back}
                className="flex-1 rounded-lg border border-white/10 text-[#b6abd9] font-semibold py-3 text-sm"
              >
                Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm disabled:opacity-60"
              >
                {saving ? "Setting up..." : "Enter the Scene 🎉"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
