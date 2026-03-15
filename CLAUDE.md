# Tresvant — Band Archive & Player

## Purpose
Tresvant is a band archive web app — a music catalog, metadata manager, and immersive listening experience. Invite-only admins upload and tag audio files with rich taxonomy, manage band photos, and maintain a personnel registry. Public visitors browse and play tracks with a photo slideshow.

## Stack
- **Frontend:** React (Vite) with Tailwind CSS v4
- **Backend/DB:** Supabase (PostgreSQL + Storage + Edge Functions + Auth)
- **Metadata:** `music-metadata` npm package in Supabase Edge Function (Deno)
- **EXIF:** `exifr` client-side in browser before upload
- **Auth:** Supabase Auth — invite-only, email/password

## Environment Variables
```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```
Never hardcode these values. Use `.env` file in `frontend/`.

## Running
- Frontend dev server: `cd frontend && npm run dev`
- Deploy Edge Functions: `supabase functions deploy extract-metadata`

## Bootstrapping First Admin
1. Create user manually in Supabase Auth dashboard
2. Insert into `admin_users` table: `INSERT INTO admin_users (id, email) VALUES ('<auth-user-uuid>', '<email>');`

## Database Schema
- `tracks` — audio track metadata, status (draft/published)
- `people` — personnel registry (name, bio)
- `track_personnel` — many-to-many tracks↔people with instrument + role
- `photos` — band photos with caption, location, event
- `photo_people` — many-to-many photos↔people
- `admin_users` — mirrors auth.users for RLS reference

## Storage Buckets (both public)
- `audio` → `tracks/{uuid}.{ext}`
- `photos` → `band/{uuid}.{ext}`
- Public URL pattern: `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`

## RLS Policy Intent
- `tracks`: public SELECT where status='published'; admin full access
- `photos`: public SELECT where featured=true; admin full access
- `people`, `track_personnel`, `photo_people`: public SELECT; admin full access
- `admin_users`: admin SELECT only

## Key Implementation Details
- Bulk audio upload concurrency limit: 3 parallel
- `music-metadata` Deno import: `npm:music-metadata`
- `exifr` runs client-side — GPS reverse geocoding uses Nominatim (no API key, respect rate limits)
- Invite links expire in 24 hours (configurable in Supabase Auth settings)
- `music-metadata` extraction quality varies — ID3v2 on MP3s reliable, WAV/FLAC may have sparse tags
