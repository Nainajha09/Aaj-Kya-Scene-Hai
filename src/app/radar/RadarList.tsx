"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinScene, leaveScene, updateScene, deleteScene, inviteToScene } from "./actions";
import { distanceKm, etaMinutes } from "@/lib/distance";
import { getSceneStatus, formatSceneTime } from "@/lib/sceneStatus";
import { createClient } from "@/lib/supabase/client";
import AddSceneForm from "./AddSceneForm";
import Avatar from "@/components/Avatar";
import type { Scene, Attendee, InvitablePerson } from "./page";

const FILTERS = ["All", "Coworking", "Café Scene", "Founders", "Pop-up Scene", "Party"];

function AvatarStack({ attendees }: { attendees: Attendee[] }) {
  const shown = attendees.slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <div className="flex">
      {shown.map((p, i) => (
        <div
          key={p.name + i}
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }}
        >
          <Avatar name={p.name} avatarUrl={p.avatarUrl} size={24} className="border-2 border-[#221f38]" />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ scene }: { scene: Scene }) {
  const status = getSceneStatus(scene.starts_at, scene.ends_at);
  if (status === "live") {
    return <span className="text-[10px] font-mono text-[#8fe3e9]">● LIVE</span>;
  }
  return (
    <span className="text-[10px] font-mono text-[#b6abd9]">
      🕒 {formatSceneTime(scene.starts_at)}
    </span>
  );
}

const TAGS = ["Coworking", "Café Scene", "Founders", "Pop-up Scene", "Party"];

function EditSceneForm({
  scene,
  onCancel,
  onSaved,
}: {
  scene: Scene;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(scene.name);
  const [tag, setTag] = useState(scene.tag);
  const [vibe, setVibe] = useState(scene.vibe ?? "");
  const [hasEndTime, setHasEndTime] = useState(!!scene.ends_at);
  const [endsAtLocal, setEndsAtLocal] = useState(
    scene.ends_at ? scene.ends_at.slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    const result = await updateScene(scene.id, {
      name,
      tag,
      vibe,
      endsAt: hasEndTime && endsAtLocal ? new Date(endsAtLocal).toISOString() : null,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
        Scene name
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg bg-[#2d2949] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
      />
      <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
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
                ? "text-xs font-semibold rounded-full px-3 py-1.5 bg-[#b298e7]/20 text-[#b298e7] border border-[#b298e7]/40"
                : "text-xs font-semibold rounded-full px-3 py-1.5 bg-[#2d2949] text-[#b6abd9] border border-white/10"
            }
          >
            {t}
          </button>
        ))}
      </div>
      <label className="block text-xs uppercase tracking-wide text-[#b6abd9] mb-1">
        Vibe (optional)
      </label>
      <input
        value={vibe}
        onChange={(e) => setVibe(e.target.value)}
        className="w-full rounded-lg bg-[#2d2949] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
      />
      <label className="flex items-center gap-2 text-xs text-[#b6abd9] mb-2">
        <input
          type="checkbox"
          checked={hasEndTime}
          onChange={(e) => setHasEndTime(e.target.checked)}
        />
        Set an end time
      </label>
      {hasEndTime && (
        <input
          type="datetime-local"
          value={endsAtLocal}
          onChange={(e) => setEndsAtLocal(e.target.value)}
          className="w-full rounded-lg bg-[#2d2949] border border-white/10 px-4 py-3 text-sm mb-3 outline-none focus:border-[#b298e7]"
        />
      )}
      {error && <p className="text-sm text-[#ef7fa8] mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-white/10 text-[#b6abd9] font-semibold py-2.5 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function InvitePanel({
  scene,
  people,
  onClose,
}: {
  scene: Scene;
  people: InvitablePerson[];
  onClose: () => void;
}) {
  const [sentTo, setSentTo] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/radar?scene=${scene.id}` : "";

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: scene.name,
          text: `Come join "${scene.name}" on Aaj Kya Scene Hai!`,
          url: shareUrl,
        });
      } catch {
        // user cancelled — no need to show an error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function sendInvite(personId: string) {
    await inviteToScene(personId, scene.id, scene.name);
    setSentTo((s) => [...s, personId]);
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-end" onClick={onClose}>
      <div
        className="bg-[#221f38] w-full max-w-sm mx-auto rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4" />
        <h2 className="font-bold text-lg mb-1">Invite people</h2>
        <p className="text-xs text-[#b6abd9] mb-4">to &quot;{scene.name}&quot;</p>

        <button
          onClick={share}
          className="w-full rounded-lg border border-[#b298e7]/40 text-[#b298e7] font-semibold py-2.5 text-sm mb-4"
        >
          {copied ? "✓ Link copied!" : "🔗 Share link"}
        </button>

        <div className="text-xs uppercase tracking-wide text-[#b6abd9] mb-2">
          Or invite directly
        </div>
        {people.length === 0 && (
          <p className="text-sm text-[#b6abd9]">No one else has signed up yet.</p>
        )}
        <div className="space-y-2">
          {people.map((p) => {
            const sent = sentTo.includes(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-[#2d2949] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={p.name} avatarUrl={p.avatar_url} size={26} />
                  <span className="text-sm">{p.name || "Unnamed"}</span>
                </div>
                <button
                  onClick={() => sendInvite(p.id)}
                  disabled={sent}
                  className={
                    sent
                      ? "text-xs font-semibold text-[#8fe3e9]"
                      : "text-xs font-semibold text-[#b298e7]"
                  }
                >
                  {sent ? "✓ Invited" : "Invite"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailSheet({
  scene,
  attendees,
  isJoined,
  isOwner,
  invitablePeople,
  onClose,
  onToggle,
  pending,
}: {
  scene: Scene;
  attendees: Attendee[];
  isJoined: boolean;
  isOwner: boolean;
  invitablePeople: InvitablePerson[];
  onClose: () => void;
  onToggle: () => void;
  pending: boolean;
}) {
  const [travelMode, setTravelMode] = useState<"walk" | "auto">("walk");
  const [distance, setDistance] = useState<number | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const status = getSceneStatus(scene.starts_at, scene.ends_at);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = distanceKm(pos.coords.latitude, pos.coords.longitude, scene.lat, scene.lng);
        setDistance(km);
      },
      () => setLocationDenied(true),
      { timeout: 8000 }
    );
  }, [scene.lat, scene.lng]);

  async function handleDelete() {
    if (!confirm(`Delete "${scene.name}"? This can't be undone.`)) return;
    setDeleting(true);
    await deleteScene(scene.id);
    setDeleting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end" onClick={onClose}>
      <div
        className="bg-[#221f38] w-full max-w-sm mx-auto rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4" />

        {editing ? (
          <EditSceneForm
            scene={scene}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              onClose();
            }}
          />
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-lg">{scene.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase text-[#b6abd9]">
                    {scene.tag}
                  </span>
                  <StatusBadge scene={scene} />
                </div>
              </div>
              <button onClick={onClose} className="text-[#b6abd9] text-sm">
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShowInvite(true)}
                className="text-xs font-semibold text-[#8fe3e9] border border-[#8fe3e9]/30 rounded-lg px-3 py-1.5"
              >
                📤 Invite
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs font-semibold text-[#b6abd9] border border-white/10 rounded-lg px-3 py-1.5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs font-semibold text-[#ef7fa8] border border-[#ef7fa8]/30 rounded-lg px-3 py-1.5 disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>

            {status === "upcoming" && (
              <div className="text-xs text-[#b298e7] bg-[#b298e7]/10 rounded-lg px-3 py-2 mb-3">
                🗓️ Starts {formatSceneTime(scene.starts_at)}
              </div>
            )}
            {scene.ends_at && (
              <div className="text-xs text-[#b6abd9] mb-3">
                Ends {formatSceneTime(scene.ends_at)}
              </div>
            )}

            {scene.vibe && (
              <div className="text-xs text-[#b298e7] bg-[#b298e7]/10 rounded-lg px-2 py-1 mb-3 inline-block">
                🎉 {scene.vibe}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-[#2d2949] rounded-lg p-1">
                <button
                  onClick={() => setTravelMode("walk")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                    travelMode === "walk" ? "bg-[#b298e7] text-[#1e1830]" : "text-[#b6abd9]"
                  }`}
                >
                  🚶 Walk
                </button>
                <button
                  onClick={() => setTravelMode("auto")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                    travelMode === "auto" ? "bg-[#b298e7] text-[#1e1830]" : "text-[#b6abd9]"
                  }`}
                >
                  🚗 Auto
                </button>
              </div>
              <div className="text-xs font-mono text-[#8fe3e9] bg-[#8fe3e9]/10 rounded-full px-3 py-1.5">
                {locationDenied
                  ? "Enable location for ETA"
                  : distance === null
                  ? "Locating..."
                  : `${etaMinutes(distance, travelMode)} min · ${distance.toFixed(1)} km`}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs uppercase tracking-wide text-[#b6abd9] mb-2">
                Who&apos;s there · {attendees.length}
              </div>
              {attendees.length === 0 && (
                <p className="text-sm text-[#b6abd9]">No one checked in yet — be the first.</p>
              )}
              <div className="space-y-2">
                {attendees.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar name={a.name} avatarUrl={a.avatarUrl} size={32} />
                    <div>
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-[#b6abd9]">{a.role}</div>
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
                  ? "w-full rounded-lg bg-[#2d2949] text-[#8fe3e9] font-semibold py-3 text-sm disabled:opacity-60"
                  : "w-full rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-3 text-sm disabled:opacity-60"
              }
            >
              {pending ? "..." : isJoined ? "✓ You're in — leave scene" : "Join scene"}
            </button>
          </>
        )}
      </div>

      {showInvite && (
        <InvitePanel scene={scene} people={invitablePeople} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

export default function RadarList({
  scenes,
  countByScene,
  attendeesByScene,
  myCheckins,
  currentUserId,
  invitablePeople,
}: {
  scenes: Scene[];
  countByScene: Record<number, number>;
  attendeesByScene: Record<number, Attendee[]>;
  myCheckins: number[];
  currentUserId: string;
  invitablePeople: InvitablePerson[];
}) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Scene | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [joined, setJoined] = useState<number[]>(myCheckins);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep "joined" in sync with the server — otherwise creating a scene
  // (which auto-checks you in server-side) wouldn't be reflected here.
  useEffect(() => {
    setJoined(myCheckins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCheckins.join(",")]);

  // Deep link support: /radar?scene=123 opens that scene's detail
  // sheet automatically — this is what invite links point to.
  useEffect(() => {
    const sceneParam = searchParams.get("scene");
    if (sceneParam) {
      const match = scenes.find((s) => s.id === Number(sceneParam));
      if (match) setSelected(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, scenes.length]);

  // Live updates: whenever anyone joins/leaves a scene or a new scene
  // is created, refresh the server data.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("radar-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "scenes" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

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
      <button
        onClick={() => setShowAddForm(true)}
        className="w-full rounded-2xl border border-dashed border-[#b298e7]/40 text-[#b298e7] font-semibold text-sm py-3 mb-4"
      >
        + Start a Scene
      </button>

      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#b298e7]/20 text-[#b298e7] border border-[#b298e7]/40"
                : "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#221f38] text-[#b6abd9] border border-white/10"
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
              className="rounded-2xl bg-[#221f38] border border-white/5 p-4 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wide text-[#b6abd9]">
                  {scene.tag}
                </span>
                <StatusBadge scene={scene} />
              </div>
              <div className="font-bold text-[15px] mb-1">{scene.name}</div>
              {scene.vibe && (
                <div className="text-xs text-[#b298e7] bg-[#b298e7]/10 rounded-lg px-2 py-1 mb-2 inline-block">
                  🎉 {scene.vibe}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <AvatarStack attendees={attendees} />
                  <span className="text-xs text-[#b6abd9]">{count} checked in</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(scene.id);
                  }}
                  disabled={pendingId === scene.id}
                  className={
                    isJoined
                      ? "text-xs font-semibold rounded-lg px-3 py-2 bg-[#2d2949] text-[#8fe3e9]"
                      : "text-xs font-semibold rounded-lg px-3 py-2 bg-[#b298e7] text-[#1e1830]"
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
          isOwner={selected.created_by === currentUserId}
          invitablePeople={invitablePeople}
          pending={pendingId === selected.id}
          onClose={() => setSelected(null)}
          onToggle={() => toggle(selected.id)}
        />
      )}

      {showAddForm && (
        <AddSceneForm
          onClose={() => {
            setShowAddForm(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
