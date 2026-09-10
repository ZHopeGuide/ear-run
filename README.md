# EAR//RUN

Melodic speedrunning — pick a phrase, race the clock through Sing it → Write it →
Play it, one continuous video proves the run. See `/Users/zhope's vault:
1.Project/EAR RUN/ear-run-handoff.md` for the full project brief.

## First-time setup (once you have Supabase + Vercel accounts)

1. **Supabase project** → SQL Editor → run `supabase/schema.sql`, then `supabase/seed.sql`.
2. **Storage bucket** → Storage → New bucket named `run-videos`, mark it public.
   Then back in SQL Editor, run the two storage policy statements commented at
   the bottom of `schema.sql`.
3. **Env vars** → copy `.env.local.example` to `.env.local`, fill in from
   Supabase Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the `anon` `public` key, not `service_role`)
4. Add songs' real `youtube_id` / `start_sec` / `end_sec` in the `songs` table
   once you've picked the exact clips (left blank for now — falls back to a
   synthesized placeholder tone where `notes` is set).

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Camera/mic recording
needs `localhost` or HTTPS — won't work over plain `http://<lan-ip>`.

## Deploy (so classmates can join from their own devices)

Push this repo to GitHub, then import it in Vercel and add the same two
`NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel project settings.

## Notes

- No real accounts — runners just type a name, saved in their browser
  (`localStorage`), same name they'll show up under on the leaderboard.
- Runs post straight to the leaderboard, no review/approval gate — fine for a
  class demo with people you know. Add a `status` column + filter if that
  changes.
