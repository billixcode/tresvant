# Tresvant — Band Archive & Player

## Full Spec
The complete product specification is at `docs/SPEC.md`. Read it before making feature changes or adding new functionality.

## Purpose
Tresvant is a band archive web app — a music catalog, metadata manager, and immersive listening experience. Invite-only admins upload and tag audio files with rich taxonomy, manage band photos, and maintain a personnel registry. Public visitors browse and play tracks with a photo slideshow.

## Stack
- **Frontend:** React 19 + Vite 6 + Tailwind CSS v4 (using `@tailwindcss/vite` plugin)
- **Backend/DB:** Supabase (PostgreSQL + Storage + Edge Functions + Auth)
- **Metadata:** `music-metadata` npm package in Supabase Edge Function (Deno)
- **EXIF:** `exifr` client-side in browser before upload
- **Auth:** Supabase Auth — invite-only, email/password
- **Icons:** `lucide-react`
- **Routing:** `react-router-dom` v7

## Environment Variables
```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```
Never hardcode these values. Use `.env` file in `frontend/`. See `.env.example`.

## Commands
```bash
# Frontend dev server
cd frontend && npm run dev

# Production build
cd frontend && npm run build

# Deploy Edge Functions
supabase functions deploy extract-metadata

# Push DB migrations
supabase db push

# Link to Supabase project
supabase link --project-ref nsmsmfqrwngxtabmfymq
```

## Supabase Project
- **Project ref:** `nsmsmfqrwngxtabmfymq`
- **URL:** `https://nsmsmfqrwngxtabmfymq.supabase.co`
- **GitHub repo:** `https://github.com/billixcode/tresvant.git`

## Bootstrapping First Admin
1. Create user manually in Supabase Auth dashboard
2. Insert into `admin_users` table: `INSERT INTO admin_users (id, email) VALUES ('<auth-user-uuid>', '<email>');`

## Database Schema
- `tracks` — audio track metadata, status (draft/published). Has `updated_at` trigger.
- `people` — personnel registry (name, bio)
- `track_personnel` — many-to-many tracks↔people with instrument + role. Role enum: performer, producer, engineer, composer, featuring
- `photos` — band photos with caption, location, event, featured flag
- `photo_people` — many-to-many photos↔people (composite PK)
- `admin_users` — mirrors auth.users for RLS reference. FK to auth.users with CASCADE delete.
- Migrations live in `supabase/migrations/` (001_initial_schema, 002_rls_policies, 003_admin_users)

## Storage Buckets (both public)
- `audio` → `tracks/{uuid}.{ext}` — accepted formats: mp3, flac, wav, m4a, ogg
- `photos` → `band/{uuid}.{ext}` — accepted formats: jpg, png, webp
- Public URL pattern: `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`

## RLS Policy Intent
- `tracks`: public SELECT where status='published'; admin full access
- `photos`: public SELECT where featured=true; admin full access
- `people`, `track_personnel`, `photo_people`: public SELECT; admin full access
- `admin_users`: admin SELECT only
- Admin check uses `is_admin()` SQL function (SECURITY DEFINER) that queries admin_users

## Frontend Architecture

### File Structure
```
frontend/src/
├── App.jsx              # Routes
├── main.jsx             # Entry point (AuthProvider + PlayerProvider + BrowserRouter)
├── index.css            # Tailwind + CSS variables
├── lib/supabase.js      # Supabase client init + getPublicUrl helper
├── hooks/
│   ├── useAuth.jsx      # AuthContext: session, isAdmin, signIn, signOut, setPassword
│   ├── usePlayer.jsx    # PlayerContext: HTML5 Audio, queue, transport, keyboard shortcuts
│   ├── useSlideshow.js  # Fisher-Yates shuffle, 5s cycle, pause sync
│   └── useUploadQueue.js # 3-concurrent upload pipeline with status tracking
├── layouts/
│   ├── PublicLayout.jsx  # Nav + Outlet + PlayerBar + SlideshowOverlay
│   └── AdminLayout.jsx   # Sidebar + Outlet + PlayerBar + SlideshowOverlay
├── components/
│   ├── catalog/          # FilterSidebar, TrackCard, TrackGrid, TrackDetailDrawer
│   ├── browse/           # Timeline, PlayerRoster, PlayerProfile, InstrumentBrowser, AlbumGrid, GenreCloud
│   ├── player/           # PlayerBar (persistent bottom bar), SlideshowOverlay
│   └── admin/            # DropZone, BulkReviewTable, PersonnelPopover, TrackEditor,
│                         # PhotoDropZone, PhotoReviewGrid, PhotoLibraryGrid, PeopleManager, InvitePanel
└── pages/
    ├── Catalog.jsx       # Landing page
    ├── Login.jsx         # /admin/login
    ├── AcceptInvite.jsx  # /admin/accept-invite
    ├── browse/           # Timeline, Players, PlayerProfile, Instruments, Albums, AlbumDetail, Genres
    └── admin/            # BulkUpload, TrackList, TrackEditor, Photos, People, Invite
```

### Routes
| Route | Auth | Page |
|---|---|---|
| `/` | No | Catalog (public landing) |
| `/browse/timeline` | No | Timeline view |
| `/browse/players` | No | Players roster |
| `/browse/players/:id` | No | Player profile |
| `/browse/instruments` | No | Instruments browser |
| `/browse/albums` | No | Albums grid |
| `/browse/albums/:id` | No | Album detail |
| `/browse/genres` | No | Genre cloud |
| `/admin/login` | No | Login form |
| `/admin/accept-invite` | No | Set password after invite |
| `/admin/tracks` | Yes | Track list |
| `/admin/upload` | Yes | Bulk audio upload |
| `/admin/tracks/:id` | Yes | Track metadata editor |
| `/admin/photos` | Yes | Photo upload & library |
| `/admin/people` | Yes | People registry |
| `/admin/invite` | Yes | Invite admins |

### Dark Theme CSS Variables
```css
--color-brand: #1a1a2e
--color-accent: #e94560
--color-surface: #16213e
--color-surface-light: #0f3460
--color-text: #eaeaea
--color-text-muted: #a0a0b0
```

### Key Patterns
- `usePlayer().playTrack(track, trackList)` to play a track with queue context
- `useAuth()` provides `{ session, isAdmin, loading, signIn, signOut, setPassword }`
- AdminRoute wrapper in App.jsx redirects unauthenticated users to /admin/login
- Files with JSX must use `.jsx` extension (Vite requirement)
- `supabase` is a named export from `lib/supabase.js`, not default

## Key Implementation Details
- Bulk audio upload concurrency limit: 3 parallel
- `music-metadata` Deno import: `npm:music-metadata`
- `exifr` runs client-side — GPS reverse geocoding uses Nominatim (no API key, respect rate limits)
- Invite links expire in 24 hours (configurable in Supabase Auth settings)
- `music-metadata` extraction quality varies — ID3v2 on MP3s reliable, WAV/FLAC may have sparse tags
- Player keyboard shortcuts: Space (play/pause), ←/→ (seek ±10s), M (mute), Esc (exit slideshow)
- Slideshow cycles every 5s with CSS crossfade, pauses when audio pauses
- View mode (grid/list) persisted to localStorage
