"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getSavedName, saveName } from "@/lib/name";
import { fmtHours } from "@/lib/time";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [totalMs, setTotalMs] = useState(0);
  const [songCount, setSongCount] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const n = getSavedName();
      setName(n);
      setSaved(!!n);
      if (n) await loadStats(n);
    })();
  }, []);

  async function loadStats(runnerName: string) {
    setLoading(true);
    const db = supabase();
    const { data } = await db.from("runs").select("song_id, total_ms").eq("runner_name", runnerName);
    const runs = data ?? [];
    setTotalMs(runs.reduce((sum, r) => sum + r.total_ms, 0));
    setSongCount(new Set(runs.map((r) => r.song_id)).size);
    setRunCount(runs.length);
    setLoading(false);
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    saveName(trimmed);
    setSaved(true);
    loadStats(trimmed);
  }

  if (!saved) {
    return (
      <section>
        <div className="intro">
          <h1>Your profile</h1>
          <p>Set your runner name to see your stats — this is the same name your runs get submitted under.</p>
        </div>
        <div className="submit-row">
          <input
            type="text"
            placeholder="Your name"
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="pill start" onClick={handleSave}>Save</button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="intro">
        <h1>{name}</h1>
        <p>
          <span className="back-link" onClick={() => setSaved(false)}>change name</span>
        </p>
      </div>
      {loading ? (
        <div className="empty">Loading…</div>
      ) : (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-num mono">{fmtHours(totalMs)}</div>
            <div className="stat-label">hours transcribed</div>
          </div>
          <div className="stat-card">
            <div className="stat-num mono">{songCount}</div>
            <div className="stat-label">songs completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-num mono">{runCount}</div>
            <div className="stat-label">total runs</div>
          </div>
        </div>
      )}
    </section>
  );
}
