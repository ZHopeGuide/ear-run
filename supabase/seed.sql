-- Run after schema.sql. Fill in youtube_id / start_sec / end_sec yourself once
-- you've got the exact clip picked (can't be guessed for you) — until then the
-- app falls back to a synthesized placeholder tone from `notes`.

insert into songs (id, title, reference_artist, difficulty, youtube_id, start_sec, end_sec, notes) values
  ('full-moon-grant-green', 'Full Moon', 'Grant Green', 'med', null, 0, 0, null),
  ('autumn-leaves', 'Autumn Leaves', 'trad. jazz standard', 'easy', null, 0, 0,
    '[["B4",0.4],["A4",0.4],["G4",0.4],["F#4",0.4],["B3",0.6]]'),
  ('so-what', 'So What', 'Miles Davis', 'med', null, 0, 0,
    '[["D3",0.3],["E3",0.3],["D3",0.3],["C4",0.3],["D4",0.3],["E4",0.3],["D4",0.3],["C4",0.6]]'),
  ('blue-bossa', 'Blue Bossa', 'jazz standard', 'med', null, 0, 0,
    '[["C4",0.4],["E4",0.4],["F4",0.4],["F#4",0.4],["G4",0.6]]')
on conflict (id) do nothing;
