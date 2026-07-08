"use client";

import { useState } from "react";
import { createScene } from "./actions";

const TAGS = ["Coworking", "Café Scene", "Founders", "Pop-up Scene", "Party"];

type VenueResult = { name: string; lat: number; lng: number };

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function AddSceneForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [vibe, setVibe] = useState("");
  const [locationMode, setLocationMode] = useState<"mine" | "search">("mine");

  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<VenueResult[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueResult | null>(null);

  const [whenMode, setWhenMode] = useState<"now" | "schedule">("now");
  const [startsAtLocal, setStartsAtLocal] = useState(toLocalInputValue(new Date()));
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endsAtLocal, setEndsAtLocal] = useState(
    toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000))
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function getMyLocation() {
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

  async function searchVenues() {
    if (searchQuery.trim().length < 3) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setError("Venue search failed — try again.");
    } finally {
      setSearching(false);
    }
  }

  function pickVenue(v: VenueResult) {
    setSelectedVenue(v);
    setResults([]);
    if (!name.trim()) {
      setName(v.name.split(",")[0]);
    }
  }

  const activeCoords = locationMode === "mine" ? coords : selectedVenue;

  async function submit() {
    if (!name.trim()) {
      setError("Give the scene a name.");
      return;
    }
    if (!activeCoords) {
      setError(
        locationMode === "mine"
          ? "Share your location first."
          : "Search and pick a venue first."
      );
      return;
    }
    setSubmitting(true);
    setError("");
    const result = await createScene({
      name,
      tag,
      lat: activeCoords.lat,
      lng: activeCoords.lng,
      vibe: vibe || undefined,
      startsAt:
        whenMode === "schedule" ? new Date(startsAtLocal).toISOString() : undefined,
      endsAt: hasEndTime ? new Date(endsAtLocal).toISOString() : undefined,
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
        className="bg-[#221f38] w-full max-w-sm mx-auto rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4" />
        <h2 className="font-bold text-lg mb-1">Start a Scene</h2>
        <p className="text-xs text-[#b6abd9] mb-4">
          Tell people what's happening, when, and where.
        </p>

        <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
          Scene name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Third Wave Coffee, Koramangala"
          className="w-full rounded-lg bg-[#2d2949] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
        />

        <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
          Type
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={
                tag === t
                  ? "text-xs font-semibold rounded-full px-3 py-1.5 bg-[#b298e7]/20 text-[#b298e7] border border-[#b298e7]/40"
                  : "text-xs font-semibold rounded-full px-3 py-1.5 bg-[#2d2949] text-[#b6abd9] border border-white/10"
              }
            >
              {t}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-2">
          When
        </label>
        <div className="flex bg-[#2d2949] rounded-lg p-1 mb-3">
          <button
            type="button"
            onClick={() => setWhenMode("now")}
            className={`flex-1 text-xs font-semibold py-2 rounded-md ${
              whenMode === "now" ? "bg-[#b298e7] text-[#1e1830]" : "text-[#b6abd9]"
            }`}
          >
            ⚡ Right now
          </button>
          <button
            type="button"
            onClick={() => setWhenMode("schedule")}
            className={`flex-1 text-xs font-semibold py-2 rounded-md ${
              whenMode === "schedule" ? "bg-[#b298e7] text-[#1e1830]" : "text-[#b6abd9]"
            }`}
          >
            🗓️ Schedule
          </button>
        </div>

        {whenMode === "schedule" && (
          <input
            type="datetime-local"
            value={startsAtLocal}
            onChange={(e) => setStartsAtLocal(e.target.value)}
            className="w-full rounded-lg bg-[#2d2949] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
          />
        )}

        <label className="flex items-center gap-2 text-xs text-[#b6abd9] mb-2">
          <input
            type="checkbox"
            checked={hasEndTime}
            onChange={(e) => setHasEndTime(e.target.checked)}
          />
          Set an end time (scene disappears from Radar after this)
        </label>
        {hasEndTime && (
          <input
            type="datetime-local"
            value={endsAtLocal}
            onChange={(e) => setEndsAtLocal(e.target.value)}
            className="w-full rounded-lg bg-[#2d2949] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
          />
        )}

        <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-2 mt-1">
          Location
        </label>
        <div className="flex bg-[#2d2949] rounded-lg p-1 mb-3">
          <button
            type="button"
            onClick={() => setLocationMode("mine")}
            className={`flex-1 text-xs font-semibold py-2 rounded-md ${
              locationMode === "mine" ? "bg-[#b298e7] text-[#1e1830]" : "text-[#b6abd9]"
            }`}
          >
            📍 I&apos;m here now
          </button>
          <button
            type="button"
            onClick={() => setLocationMode("search")}
            className={`flex-1 text-xs font-semibold py-2 rounded-md ${
              locationMode === "search" ? "bg-[#b298e7] text-[#1e1830]" : "text-[#b6abd9]"
            }`}
          >
            🔍 Search a venue
          </button>
        </div>

        {locationMode === "mine" ? (
          <>
            <button
              type="button"
              onClick={getMyLocation}
              disabled={locating}
              className="w-full rounded-lg border border-white/10 text-[#b6abd9] font-semibold py-2.5 text-xs mb-2 disabled:opacity-60"
            >
              {locating
                ? "Locating..."
                : coords
                ? "📍 Location captured — tap to refresh"
                : "📍 Share my current location"}
            </button>
            {locationError && <p className="text-xs text-[#ef7fa8] mb-2">{locationError}</p>}
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchVenues()}
                placeholder="e.g. WeWork BKC Mumbai"
                className="flex-1 rounded-lg bg-[#2d2949] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#b298e7]"
              />
              <button
                type="button"
                onClick={searchVenues}
                disabled={searching}
                className="rounded-lg bg-[#2d2949] border border-white/10 px-4 text-xs font-semibold text-[#b6abd9] disabled:opacity-60"
              >
                {searching ? "..." : "Search"}
              </button>
            </div>

            {results.length > 0 && (
              <div className="space-y-1 mb-2">
                {results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickVenue(r)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-[#2d2949] border border-white/5 text-[#b6abd9] hover:border-[#b298e7]/40"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}

            {selectedVenue && (
              <div className="text-xs text-[#8fe3e9] bg-[#8fe3e9]/10 rounded-lg px-3 py-2 mb-2">
                ✓ Using: {selectedVenue.name}
              </div>
            )}
          </>
        )}

        <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1 mt-1">
          Vibe (optional)
        </label>
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="e.g. Chill house music, open till late"
          className="w-full rounded-lg bg-[#2d2949] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
        />

        {error && <p className="text-sm text-[#ef7fa8] mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "Starting..." : "Start this scene"}
        </button>
      </div>
    </div>
  );
}
