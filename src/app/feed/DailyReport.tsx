"use client";

import { useState, useEffect } from "react";

export default function DailyReport() {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchReport() {
    setLoading(true);
    try {
      const res = await fetch("/api/scene-report", { method: "POST" });
      const data = await res.json();
      setReport(data.result || data.error || "Scene's quiet right now.");
    } catch {
      setReport("Couldn't reach the scene right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl bg-[#1f1d27] border border-[#cf8a5e]/20 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-[#cf8a5e]">
          ✨ Aaj Ka Scene Report
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="text-[10px] text-[#aca3bd] disabled:opacity-50"
        >
          {loading ? "..." : "↻ Refresh"}
        </button>
      </div>
      <p className="text-sm leading-relaxed">
        {loading && !report ? "Reading the room..." : report}
      </p>
    </div>
  );
}