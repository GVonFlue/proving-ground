# Proving Ground

A closed crew tracker for the 75 Hard challenge. Daily check-ins, a live leaderboard, daily notes, and crew chat. Powered by ProyTech.

## Stack
Vite + React, Supabase (auth, Postgres, realtime), Vercel.

## Setup
1. Create a Supabase project. In SQL Editor, run `supabase/schema.sql`.
2. Supabase > Authentication > URL Configuration: set Site URL to your live domain and add it under Redirect URLs.
3. Vercel: import the repo, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, deploy.

## Invite code
Default is `HOLDTHELINE`. Change it any time in SQL Editor:
`update crew_settings set invite_code = 'NEWCODE' where id = 1;`

## Rules the app enforces
- All six tasks done = the day is cleared. Days use Central time.
- You can edit today and yesterday only.
- Miss a day and your count goes back to Day 1 automatically. Restarts are tracked.

## Dev
`npm install`, then `npm run dev`. Tests: `npm test`.
