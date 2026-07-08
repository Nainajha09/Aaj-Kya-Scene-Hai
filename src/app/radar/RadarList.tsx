"use client";

import { useState, useEffect } from "react";
import { joinScene, leaveScene } from "./actions";
import { distanceKm, etaMinutes } from "@/lib/distance";
import type { Scene, Attendee } from "./page";

const FILTERS = ["All", "Coworking", "Café Scene", "Founders", "Pop-up Scene", "Party"];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AvatarStack({ attendees }: { attendees: Attendee[] }) {
  const shown = attendees.slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <div className="flex">
      {shown.map((p, i) => (
        <div
          key={p.name + i}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold text-[#1a1108] border-2 border-[#1f1d27]"
          style={{
            background: "linear-gradient(135deg, #cf8a5e, #b5657f)",
            marginLeft: i === 0 ? 0 : -8,
            zIndex: shown.length - i,
          }}
        >
          {initials(p.name)}
        </div>
      ))}
    </div>
  );
}

function DetailSheet({
  scene,
  attendees,
  isJoined,
  onClose,
  onToggle,
  pending,
}: {
  scene: Scene;
  attendees: Attendee[];
  isJoined: boolean;
  onClose: () => void;
  onToggle: () => void;
  pending: boolean;
}) {
  const [travelMode, setTravelMode] = useState<"walk" | "auto">("walk");
  const [distance, setDistance] = useState<number | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = distanceKm(
          pos.coords.latitude,
          pos.coords.longitude,
          scene.lat,
          scene.lng
        );
        setDistance(km);
      },
      () => setLocationDenied(true),
      { timeout: 8000 }
    );
  }, [scene.lat, scene.lng]);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[60] flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-[#1f1d27] w-full max-w-sm mx-auto rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4" />
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-bold text-lg">{scene.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase text-[#aca3bd]">
                {scene.tag}
              </span>
              {scene.is_live && (
                <span className="text-[10px] font-mono text-[#9cbf7a]">● LIVE</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-[#aca3bd] text-sm">
            ✕
          </button>
        </div>

        {scene.vibe && (
          <div className="text-xs text-[#cf8a5e] bg-[#cf8a5e]/10 rounded-lg px-2 py-1 mb-3 inline-block">
            🎉 {scene.vibe}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-[#29262f] rounded-lg p-1">
            <button
              onClick={() => setTravelMode("walk")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                travelMode === "walk" ? "bg-[#cf8a5e] text-[#1a1108]" : "text-[#aca3bd]"
              }`}
            >
              🚶 Walk
            </button>
            <button
              onClick={() => setTravelMode("auto")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                travelMode === "auto" ? "bg-[#cf8a5e] text-[#1a1108]" : "text-[#aca3bd]"
              }`}
            >
              🚗 Auto
            </button>
          </div>
          <div className="text-xs font-mono text-[#9cbf7a] bg-[#9cbf7a]/10 rounded-full px-3 py-1.5">
            {locationDenied
              ? "Enable location for ETA"
              : distance === null
              ? "Locating..."
              : `${etaMinutes(distance, travelMode)} min · ${distance.toFixed(1)} km`}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide text-[#aca3bd] mb-2">
            Who&apos;s there · {attendees.length}
          </div>
          {attendees.length === 0 && (
            <p className="text-sm text-[#aca3bd]">No one checked in yet — be the first.</p>
          )}
          <div className="space-y-2">
            {attendees.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold text-[#1a1108]"
                  style={{ background: "linear-gradient(135deg, #cf8a5e, #b5657f)" }}
                >
                  {initials(a.name)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{a.name}</div>
                  <div className="text-xs text-[#aca3bd]">{a.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onToggle}
          disabled={pending}
          className={
            isJoined
              ? "w-full rounded-lg bg-[#29262f] text-[#9cbf7a] font-semibold py-3 text-sm disabled:opacity-60"
              : "w-full rounded-lg bg-[#cf8a5e] text-[#1a1108] font-semibold py-3 text-sm disabled:opacity-60"
          }
        >
          {pending ? "..." : isJoined ? "✓ You're in — leave scene" : "Join scene"}
        </button>
      </div>
    </div>
  );
}

export default function RadarList({
  scenes,
  countByScene,
  attendeesByScene,
  myCheckins,
}: {
  scenes: Scene[];
  countByScene: Record<number, number>;
  attendeesByScene: Record<number, Attendee[]>;
  myCheckins: number[];
}) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Scene | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [joined, setJoined] = useState<number[]>(myCheckins);

  const filtered = filter === "All" ? scenes : scenes.filter((s) => s.tag === filter);

  async function toggle(sceneId: number) {
    setPendingId(sceneId);
    if (joined.includes(sceneId)) {
      await leaveScene(sceneId);
      setJoined((j) => j.filter((id) => id !== sceneId));
    } else {
      await joinScene(sceneId);
      setJoined((j) => [...j, sceneId]);
    }
    setPendingId(null);
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#cf8a5e]/20 text-[#cf8a5e] border border-[#cf8a5e]/40"
                : "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#1f1d27] text-[#aca3bd] border border-white/10"
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((scene) => {
          const isJoined = joined.includes(scene.id);
          const count = countByScene[scene.id] ?? 0;
          const attendees = attendeesByScene[scene.id] ?? [];
          return (
            <div
              key={scene.id}
              onClick={() => setSelected(scene)}
              className="rounded-2xl bg-[#1f1d27] border border-white/5 p-4 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wide text-[#aca3bd]">
                  {scene.tag}
                </span>
                {scene.is_live && (
                  <span className="text-[10px] font-mono text-[#9cbf7a]">● LIVE</span>
                )}
              </div>
              <div className="font-bold text-[15px] mb-1">{scene.name}</div>
              {scene.vibe && (
                <div className="text-xs text-[#cf8a5e] bg-[#cf8a5e]/10 rounded-lg px-2 py-1 mb-2 inline-block">
                  🎉 {scene.vibe}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <AvatarStack attendees={attendees} />
                  <span className="text-xs text-[#aca3bd]">{count} checked in</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(scene.id);
                  }}
                  disabled={pendingId === scene.id}
                  className={
                    isJoined
                      ? "text-xs font-semibold rounded-lg px-3 py-2 bg-[#29262f] text-[#9cbf7a]"
                      : "text-xs font-semibold rounded-lg px-3 py-2 bg-[#cf8a5e] text-[#1a1108]"
                  }
                >
                  {pendingId === scene.id ? "..." : isJoined ? "✓ Joined" : "Join"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <DetailSheet
          scene={selected}
          attendees={attendeesByScene[selected.id] ?? []}
          isJoined={joined.includes(selected.id)}
          pending={pendingId === selected.id}
          onClose={() => setSelected(null)}
          onToggle={() => toggle(selected.id)}
        />
      )}
    </>
  );
}
