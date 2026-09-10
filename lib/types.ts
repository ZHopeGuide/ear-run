export type Difficulty = 'easy' | 'med' | 'hard';

export type Song = {
  id: string;
  title: string;
  reference_artist: string; // the specific recording being replicated, e.g. "Grant Green"
  difficulty: Difficulty;
  youtube_id: string | null;
  start_sec: number;
  end_sec: number;
  notes: [string, number][] | null; // fallback placeholder tone: [note, duration_sec][]
};

export type Run = {
  id: string;
  song_id: string;
  runner_name: string;
  total_ms: number;
  split_ms: number[]; // 3 cumulative split times: [sing, write, play]
  video_path: string | null;
  created_at: string;
};

export const SEGMENTS = ['Sing it', 'Write it', 'Play it'] as const;
