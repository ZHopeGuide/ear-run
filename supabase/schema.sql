-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists songs (
  id text primary key,
  title text not null,
  reference_artist text not null,
  difficulty text not null check (difficulty in ('easy', 'med', 'hard')),
  youtube_id text,
  start_sec int not null default 0,
  end_sec int not null default 0,
  -- fallback only: [[note, duration_sec], ...] synthesized as a placeholder
  -- reference tone when youtube_id isn't set yet. Not a claim of accuracy —
  -- just something to play while you're still picking the real clip.
  notes jsonb
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  song_id text not null references songs(id),
  runner_name text not null,
  total_ms int not null,
  split_ms int[] not null,
  video_path text,
  created_at timestamptz not null default now()
);

alter table songs enable row level security;
alter table runs enable row level security;

-- ponytail: wide-open policies, fine for a class-demo prototype with people you
-- trust in the room. Tighten (auth-scoped policies, review/approval gate before
-- a run counts) before this is ever a public product.
create policy "anyone can read songs" on songs for select using (true);
create policy "anyone can read runs" on runs for select using (true);
create policy "anyone can insert runs" on runs for insert with check (true);

-- storage bucket for run proof videos — create it once via the dashboard
-- (Storage > New bucket, name it "run-videos", make it public), then run:
-- create policy "anyone can upload run videos" on storage.objects
--   for insert with check (bucket_id = 'run-videos');
-- create policy "anyone can read run videos" on storage.objects
--   for select using (bucket_id = 'run-videos');
