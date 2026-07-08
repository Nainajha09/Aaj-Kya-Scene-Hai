"use client";

import { useState } from "react";
import { createScene } from "./actions";

const TAGS = ["Coworking", "Café Scene", "Founders", "Pop-up Scene", "Party"];

export default function AddSceneForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [vibe, setVibe] = useState("");
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function getLocation() {
    setLocating(true);
    setLocationError("");
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser doesn't support location.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("Couldn't get your location — check permissions.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  async function submit() {
    if (!name.trim()) {
      setError("Give the scene a name.");
      return;
    }
    if (!coords) {
      setError("Share your location first so people know where this is.");
      return;
    }
    setSubmitting(true);
    setError("");
    const result = await createScene({
      name,
      tag,
      lat: coords.lat,
      lng: coords.lng,
      vibe: vibe || undefined,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end" onClick={onClose}>
      <div
        className="bg-[#1f1d27] w-full max-w-sm mx-auto rounded-t-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4" />
        <h2 className="font-bold text-lg mb-1">Start a Scene</h2>
        <p className="text-xs text-[#aca3bd] mb-4">
          Tell people what's happening where you are, right now.
        </p>

        <label className="block text-xs uppercase tracking-wide text-[#aca3bd] mb-1">
          Scene name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Third Wave Coffee, Koramangala"
          className="w-full rounded-lg bg-[#29262f] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#cf8a5e]"
        />

        <label className="block text-xs uppercase tracking-wide text-[#aca3bd] mb-1">
          Type
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={
                tag === t
                  ? "text-xs font-semibold rounded-full px-3 py-1.5 bg-[#cf8a5e]/20 text-[#cf8a5e] border border-[#cf8a5e]/40"
                  : "text-xs font-semibold rounded-full px-3 py-1.5 bg-[#29262f] text-[#aca3bd] border border-white/10"
              }
            >
              {t}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wide text-[#aca3bd] mb-1">
          Vibe (optional)
        </label>
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="e.g. Chill house music, open till late"
          className="w-full rounded-lg bg-[#29262f] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#cf8a5e]"
        />

        <button
          type="button"
          onClick={getLocation}
          disabled={locating}
          className="w-full rounded-lg border border-white/10 text-[#aca3bd] font-semibold py-2.5 text-xs mb-2 disabled:opacity-60"
        >
          {locating
            ? "Locating..."
            : coords
            ? "📍 Location captured — tap to refresh"
            : "📍 Share my current location"}
        </button>
        {locationError && <p className="text-xs text-[#c97b93] mb-2">{locationError}</p>}

        {error && <p className="text-sm text-[#c97b93] mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-lg bg-[#cf8a5e] text-[#1a1108] font-semibold py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "Starting..." : "Start this scene"}
        </button>
      </div>
    </div>
  );
}
