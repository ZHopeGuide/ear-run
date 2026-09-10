"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getSavedName } from "@/lib/name";
import { fmtTime } from "@/lib/time";
import type { Run, Song } from "@/lib/types";

export default function LeaderboardPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const myName = getSavedName();

  useEffect(() => {
    (async () => {
      const db = supabase();
      const { data } = await db.from("songs").select("*").order("title");
      setSongs(data ?? []);
      if (data && data.length > 0) setActiveId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      setLoading(true);
      const db = supabase();
      const { data } = await db
        .from("runs")
        .select("*")
        .eq("song_id", activeId)
        .order("total_ms", { ascending: true })
        .limit(50);
      setEntries(data ?? []);
      setLoading(false);
    })();
  }, [activeId]);

  return (
    <section>
      <div className="lb-song-select">
        {songs.map((s) => (
          <button
            key={s.id}
            className={s.id === activeId ? "active" : ""}
            onClick={() => setActiveId(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Runner</th>
            <th className="r">Time</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={3} className="empty">Loading…</td></tr>
          )}
          {!loading && entries.length === 0 && (
            <tr><td colSpan={3} className="empty">No runs yet on this one — be the first.</td></tr>
          )}
          {!loading &&
            entries.map((e, i) => (
              <tr key={e.id} className={`${i === 0 ? "gold" : ""} ${e.runner_name === myName ? "mine" : ""}`}>
                <td className="rank mono">{i + 1}</td>
                <td>{e.runner_name}</td>
                <td className="time mono">{fmtTime(e.total_ms)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}
