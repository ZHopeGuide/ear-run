"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { getSavedName, saveName } from "@/lib/name";
import { fmtTime } from "@/lib/time";
import { playReferenceTone } from "@/lib/referenceTone";
import { SEGMENTS } from "@/lib/types";
import type { Song } from "@/lib/types";

type PbSplits = { total: number; splits: number[] };

export default function RacePage({ params }: { params: Promise<{ songId: string }> }) {
  const { songId } = use(params);

  const [song, setSong] = useState<Song | null>(null);
  const [pbSplits, setPbSplits] = useState<PbSplits | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [segIndex, setSegIndex] = useState(0);
  const [splitTimes, setSplitTimes] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [display, setDisplay] = useState("00:00.00");
  const [recording, setRecording] = useState(false);
  const [ytOn, setYtOn] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [elapsedFinal, setElapsedFinal] = useState(0);

  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    (async () => {
      setName(getSavedName());
      const db = supabase();
      const { data: songData } = await db.from("songs").select("*").eq("id", songId).maybeSingle();
      if (!songData) {
        setNotFound(true);
        return;
      }
      setSong(songData);

      const savedName = getSavedName();
      if (savedName) {
        const { data: runs } = await db
          .from("runs")
          .select("total_ms, split_ms")
          .eq("song_id", songId)
          .eq("runner_name", savedName)
          .order("total_ms", { ascending: true })
          .limit(1);
        if (runs && runs.length > 0) {
          setPbSplits({ total: runs[0].total_ms, splits: runs[0].split_ms });
        }
      }
    })();
  }, [songId]);

  function playReference() {
    if (!song) return;
    if (song.youtube_id) {
      setYtOn((v) => !v);
      return;
    }
    if (song.notes) playReferenceTone(song.notes);
  }

  async function startRun() {
    setStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true;
        videoPreviewRef.current.play();
      }
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setStatus("Camera rolling — sing, write, play, all in one clip.");
    } catch {
      setStatus("No camera/mic access — timer-only mode, no proof clip.");
    }

    startTimeRef.current = performance.now();
    setSegIndex(0);
    setSplitTimes([]);
    setRunning(true);
    timerRef.current = setInterval(() => {
      setDisplay(fmtTime(performance.now() - startTimeRef.current));
    }, 30);
  }

  function doSplit() {
    // ponytail: performance.now() here is a false-positive purity flag — this
    // only ever runs from a click handler, never during render.
    // eslint-disable-next-line react-hooks/purity
    const now = Math.round(performance.now() - startTimeRef.current);
    const next = [...splitTimes];
    next[segIndex] = now;
    setSplitTimes(next);
    const nextIndex = segIndex + 1;
    setSegIndex(nextIndex);

    if (nextIndex >= SEGMENTS.length) {
      finishRun(now);
    }
  }

  function finishRun(totalMs: number) {
    setElapsedFinal(totalMs);
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setFinished(true);
    setRecording(false);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        videoBlobRef.current = blob;
        setVideoUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.stop();
    }
  }

  async function submitRun() {
    if (!song) return;
    const finalName = name.trim() || "anonymous";
    setSubmitting(true);
    setStatus("Submitting…");
    saveName(finalName);

    const db = supabase();
    let videoPath: string | null = null;

    if (videoBlobRef.current) {
      const path = `${song.id}/${Date.now()}-${crypto.randomUUID()}.webm`;
      const { error: uploadError } = await db.storage
        .from("run-videos")
        .upload(path, videoBlobRef.current, { contentType: "video/webm" });
      if (!uploadError) videoPath = path;
    }

    const { error } = await db.from("runs").insert({
      song_id: song.id,
      runner_name: finalName,
      total_ms: elapsedFinal,
      split_ms: splitTimes,
      video_path: videoPath,
    });

    if (error) {
      setStatus("Could not submit — " + error.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setStatus(
      !pbSplits || elapsedFinal < pbSplits.total ? "Submitted — new personal best!" : "Submitted to the board."
    );
  }

  if (notFound) {
    return (
      <section>
        <Link href="/" className="back-link">← back to songs</Link>
        <div className="empty">Couldn&apos;t find that song.</div>
      </section>
    );
  }

  if (!song) {
    return (
      <section>
        <Link href="/" className="back-link">← back to songs</Link>
        <div className="empty">Loading…</div>
      </section>
    );
  }

  return (
    <section>
      <Link href="/" className="back-link">← back to songs</Link>
      <div className="race-head">
        <h2>{song.title}</h2>
        <div className="by">{song.reference_artist}</div>
      </div>

      <div className="splits-panel">
        {SEGMENTS.map((seg, i) => {
          const state = i < segIndex ? "done" : i === segIndex ? "current" : "pending";
          let right = <div className="seg-time-block"><div className="seg-time mono" style={{ color: "var(--paper-dim)" }}>—</div></div>;
          if (i < segIndex) {
            const segTime = splitTimes[i] - (i > 0 ? splitTimes[i - 1] : 0);
            let delta: React.ReactNode = null;
            if (pbSplits) {
              const pbSegTime = pbSplits.splits[i] - (i > 0 ? pbSplits.splits[i - 1] : 0);
              const d = segTime - pbSegTime;
              const cls = d <= 0 ? "ahead" : "behind";
              delta = (
                <div className={`seg-delta mono ${cls}`}>
                  {d <= 0 ? "-" : "+"}{fmtTime(Math.abs(d))}
                </div>
              );
            }
            right = (
              <div className="seg-time-block">
                <div className="seg-time mono">{fmtTime(segTime)}</div>
                {delta}
              </div>
            );
          }
          return (
            <div key={seg} className={`split-row ${state}`}>
              <div className="seg-name">{seg}</div>
              {right}
            </div>
          );
        })}
      </div>

      <div className="timer-block">
        <div className={`timer-digits mono ${running ? "running" : ""}`}>{display}</div>
        <div className="timer-sub">
          {finished ? "RUN COMPLETE" : running ? SEGMENTS[segIndex].toUpperCase() : "READY"}
        </div>
        <div className={`cam-preview ${recording ? "on" : ""}`}>
          <video ref={videoPreviewRef} playsInline />
        </div>
        <div className={`rec-dot ${recording ? "on" : ""}`}>
          <i /> <span>RECORDING</span>
        </div>
      </div>

      <div className="controls">
        <button className="pill ghost" onClick={playReference} disabled={running}>
          ▶ Play reference phrase
        </button>
        {!running && !finished && (
          <button className="pill start" onClick={startRun}>Start run</button>
        )}
        {running && (
          <button className="pill start" onClick={doSplit}>Split: {SEGMENTS[segIndex]}</button>
        )}
      </div>

      {song.youtube_id && ytOn && (
        <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", maxWidth: 360 }}>
          <iframe
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="autoplay"
            src={`https://www.youtube.com/embed/${song.youtube_id}?autoplay=1&start=${song.start_sec || 0}${
              song.end_sec ? `&end=${song.end_sec}` : ""
            }`}
          />
        </div>
      )}

      <div className="hint">
        Starting a run asks for camera + mic access so the whole attempt — singing, writing,
        playing — gets recorded as one clip, like a speedrun proof video. Press the main
        button once per stage: it splits to the next segment, and splitting the last one
        (Play it) finishes the run.
      </div>
      <div className="status-line">{status}</div>

      {finished && (
        <div className="recap show">
          <div className="recap-time mono">{fmtTime(elapsedFinal)}</div>
          <p>{videoUrl ? "Run complete — here's your take. Submit it to the board." : "Run complete — no clip was recorded this time."}</p>
          {videoUrl && <video className="recap-video" src={videoUrl} controls />}
          <div className="submit-row">
            <input
              type="text"
              placeholder="Your name for the board"
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitted}
            />
            <button className="pill start" onClick={submitRun} disabled={submitting || submitted}>
              {submitted ? "Submitted" : "Submit time"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
