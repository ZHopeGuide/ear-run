"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { getSavedName } from "@/lib/name";
import { fmtTime } from "@/lib/time";
import type { Song } from "@/lib/types";

const DIFF_LABEL = { easy: "Easy", med: "Medium", hard: "Hard" };

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [bests, setBests] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const db = supabase();
      const { data: songData } = await db.from("songs").select("*").order("title");
      setSongs(songData ?? []);

      const name = getSavedName();
      if (name) {
        const { data: runs } = await db
          .from("runs")
          .select("song_id, total_ms")
          .eq("runner_name", name);
        const b: Record<string, number> = {};
        for (const r of runs ?? []) {
          if (b[r.song_id] == null || r.total_ms < b[r.song_id]) b[r.song_id] = r.total_ms;
        }
        setBests(b);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <section>
      <div className="intro">
        <h1>Learn it by ear. Beat the clock.</h1>
        <p>
          Pick a phrase, hit start, and race to play it back on your instrument — no sheet
          music, no tab, just your ears. The clock stops when you nail it. Your run video is
          the proof.
        </p>
      </div>
      <div className="song-list">
        {loading && <div className="empty">Loading songs…</div>}
        {!loading && songs.length === 0 && (
          <div className="empty">No songs yet — add some in the Supabase songs table.</div>
        )}
        {songs.map((song) => (
          <Link key={song.id} href={`/race/${song.id}`} className="song-card">
            <div>
              <div className="song-title">{song.title}</div>
              <div className="song-artist">{song.reference_artist}</div>
            </div>
            <div className="song-meta">
              <span className={`diff ${song.difficulty}`}>{DIFF_LABEL[song.difficulty]}</span>
              {bests[song.id] != null && (
                <div className="song-best mono">your best {fmtTime(bests[song.id])}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
