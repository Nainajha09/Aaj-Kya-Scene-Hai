"use client";

import { useState } from "react";
import { joinScene, leaveScene } from "./actions";

type Scene = {
  id: number;
  name: string;
  tag: string;
  vibe: string | null;
  is_live: boolean;
};

export default function RadarList({
  scenes,
  countByScene,
  myCheckins,
}: {
  scenes: Scene[];
  countByScene: Record<number, number>;
  myCheckins: number[];
}) {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [joined, setJoined] = useState<number[]>(myCheckins);

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
    <div className="space-y-3">
      {scenes.map((scene) => {
        const isJoined = joined.includes(scene.id);
        const count = countByScene[scene.id] ?? 0;
        return (
          <div
            key={scene.id}
            className="rounded-2xl bg-[#1f1d27] border border-white/5 p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[#aca3bd]">
                {scene.tag}
              </span>
              {scene.is_live && (
                <span className="text-[10px] font-mono text-[#9cbf7a]">
                  ● LIVE
                </span>
              )}
            </div>
            <div className="font-bold text-[15px] mb-1">{scene.name}</div>
            {scene.vibe && (
              <div className="text-xs text-[#cf8a5e] bg-[#cf8a5e]/10 rounded-lg px-2 py-1 mb-2 inline-block">
                🎉 {scene.vibe}
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#aca3bd]">
                {count} checked in
              </span>
              <button
                onClick={() => toggle(scene.id)}
                disabled={pendingId === scene.id}
                className={
                  isJoined
                    ? "text-xs font-semibold rounded-lg px-3 py-2 bg-[#29262f] text-[#9cbf7a]"
                    : "text-xs font-semibold rounded-lg px-3 py-2 bg-[#cf8a5e] text-[#1a1108]"
                }
              >
                {pendingId === scene.id
                  ? "..."
                  : isJoined
                  ? "✓ Joined"
                  : "Join"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}