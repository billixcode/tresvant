# 🎵 Tresvant — Music Archive & Player
## Claude Code Project Specification v3

---

### 1. Project Overview

**Tresvant** is a band archive web application — a music catalog, metadata manager, and immersive listening experience. Invite-only admins upload and tag audio files with rich taxonomy, manage band photos, and maintain a personnel registry. Public visitors browse the catalog and play tracks while a rotating photo slideshow of the band plays in the background.

**Stack:**
- **Frontend:** React (Vite) → deployed to Vercel or Netlify
- **Backend/DB:** Supabase (PostgreSQL + Storage + Edge Functions + Auth)
- **Metadata extraction:** `music-metadata` npm package in a Supabase Edge Function (Deno/TypeScript)
- **EXIF extraction:** `exifr` (client-side, runs in browser before upload)
- **Auth:** Supabase Auth — invite-only, email/password

---

### 2. User Roles

| Role | How They Get Access | What They Can Do |
|---|---|---|
| **Public** | No account needed | Browse catalog, play tracks, view all browse views |
| **Admin** | Invited by existing admin | Everything — upload, edit, manage photos, invite others |

There is no self-registration. The only way into the admin is via an email invitation sent by an existing admin. The first admin account is bootstrapped manually via the Supabase dashboard.

---

### 3. Authentication & Invite System

#### 3.1 How Invites Work

Supabase Auth has a built-in `inviteUserByEmail` method that:
1. Creates a user record in `auth.users` with a pending status
2. Sends an email with a magic invite link (Supabase handles delivery)
3. Recipient clicks the link, lands on `/admin/accept-invite`, sets their password, and gains full admin access

No custom email infrastructure needed.

#### 3.2 Admin Invite Flow (in-app)

Inside the admin panel, an **Invite Admin** page lets existing admins send invitations:

```
Invite a new admin
  Email address: ________________
  [ Send Invitation ]
```

On submit, calls `supabase.auth.admin.inviteUserByEmail(email)`. The invited user receives an email with a link valid for 24 hours.

#### 3.3 Accept Invite Page (`/admin/accept-invite`)

Supabase redirects the invite link to this page with a token in the URL. The page:
- Detects the token automatically via `supabase.auth.onAuthStateChange`
- Shows a simple "Set your password" form
- On submit, completes account setup and redirects to `/admin`

#### 3.4 Admin Role Enforcement

All admin users are stored in a custom `admin_users` table (mirroring `auth.users`) so Row Level Security policies can reference it cleanly:

```sql
admin_users
  id          uuid (FK → auth.users)
  email       text
  invited_by  uuid (FK → admin_users)
  created_at  timestamptz
```

RLS policies:
- `tracks`: public can `SELECT` where `status = 'published'`; admins can do all operations
- `photos`: public can `SELECT` where `featured = true`; admins can do all operations
- `people`, `track_personnel`, `genres`, `photo_people`: public `SELECT`; admin full access
- `admin_users`: admin `SELECT` only (no public visibility)

#### 3.5 Auth Gate

All `/admin/*` routes check for an authenticated session. If none, redirect to `/admin/login`. Login is email/password only — no social login in v1.

---

### 4. Data Models

#### 4.1 PostgreSQL Tables

```sql
-- Tracks
tracks
  id              uuid PK default gen_random_uuid()
  title           text NOT NULL
  album           text
  recorded_date   date
  released_date   date
  duration_secs   integer          -- auto-extracted
  genre           text[]           -- array of genre tags
  key             text             -- e.g. "A minor"
  tempo_bpm       integer
  notes           text             -- liner notes, free text
  storage_path    text             -- Supabase Storage path
  cover_art_url   text
  status          text default 'draft'   -- 'draft' | 'published'
  created_at      timestamptz default now()
  updated_at      timestamptz default now()

-- Personnel registry
people
  id              uuid PK default gen_random_uuid()
  name            text NOT NULL
  bio             text
  created_at      timestamptz default now()

-- Track ↔ Personnel (many-to-many)
track_personnel
  id              uuid PK default gen_random_uuid()
  track_id        uuid FK → tracks(id) ON DELETE CASCADE
  person_id       uuid FK → people(id) ON DELETE RESTRICT
  instrument      text             -- e.g. "electric guitar"
  role            text             -- performer | producer | engineer | composer | featuring
  session_notes   text

-- Photos
photos
  id              uuid PK default gen_random_uuid()
  storage_path    text NOT NULL
  caption         text
  photo_date      date
  location        text             -- e.g. "Ashford Theater"
  event_name      text             -- e.g. "Summer Tour 2023"
  featured        boolean default true
  created_at      timestamptz default now()

-- Photo ↔ People (many-to-many)
photo_people
  photo_id        uuid FK → photos(id) ON DELETE CASCADE
  person_id       uuid FK → people(id) ON DELETE RESTRICT

-- Admin users
admin_users
  id              uuid FK → auth.users(id) ON DELETE CASCADE
  email           text NOT NULL
  invited_by      uuid FK → admin_users(id)
  created_at      timestamptz default now()
```

#### 4.2 Supabase Storage Buckets

```
audio/          (public bucket)
  └── tracks/
        └── {uuid}.{ext}

photos/         (public bucket)
  └── band/
        └── {uuid}.{ext}
```

---

### 5. Application Sections & Routes

| Section | Route | Auth Required |
|---|---|---|
| Public Catalog | `/` | No |
| Browse — Timeline | `/browse/timeline` | No |
| Browse — Players | `/browse/players` | No |
| Browse — Player Profile | `/browse/players/:id` | No |
| Browse — Instruments | `/browse/instruments` | No |
| Browse — Albums | `/browse/albums` | No |
| Browse — Album Detail | `/browse/albums/:id` | No |
| Browse — Genres | `/browse/genres` | No |
| Admin Login | `/admin/login` | No |
| Accept Invite | `/admin/accept-invite` | No |
| Admin — Track List | `/admin/tracks` | ✅ |
| Admin — Bulk Upload | `/admin/upload` | ✅ |
| Admin — Track Editor | `/admin/tracks/:id` | ✅ |
| Admin — Photos | `/admin/photos` | ✅ |
| Admin — People | `/admin/people` | ✅ |
| Admin — Invite | `/admin/invite` | ✅ |

---

### 6. Feature Specifications

---

#### 6.1 Public Catalog (Songs View)

- Default landing page
- Grid and list view toggle (user preference persisted in `localStorage`)
- **Filter sidebar:** album, genre (multi-select), recorded date range, personnel name
- **Text search:** across title and personnel names
- Track cards show: title, album, recorded date, duration, top-line personnel summary
- Only tracks with `status = 'published'` are visible
- Clicking a card opens a **Track Detail Drawer** (slides in from right):
  - Full metadata display
  - Complete personnel list with instrument and role per person
  - Play button → loads track into the player

---

#### 6.2 Browse Views

All views share the persistent bottom-bar player and the same nav. Switching views never interrupts playback.

**Timeline (`/browse/timeline`)**
- Tracks grouped by `recorded_date` year, descending
- Each year is a collapsible section showing track count
- Within each year, tracks sorted by date ascending (chronological)
- Years with 3 or fewer tracks render as a compact flat row

**Players (`/browse/players`)**
- Roster grid of all people in the People registry
- Each card: name, instruments played (aggregated), track count
- Clicking opens **Player Profile** (`/browse/players/:id`):
  - Name, bio, full instrument list
  - Grid of all tracks they appear on, filterable by instrument
  - All tracks playable directly from the profile

**Instruments (`/browse/instruments`)**
- List of all distinct instruments across `track_personnel`
- Each row: instrument name, track count, player names
- Clicking an instrument shows all tracks featuring it, with the relevant player highlighted

**Albums (`/browse/albums`)**
- Groups tracks by `album` value
- Each album card: name, track count, date range, total duration, personnel summary
- Clicking opens album detail page with full track list in order
- Tracks with no `album` value grouped under "Untagged"

**Genres (`/browse/genres`)**
- Tag cloud or grouped list of all genre values from `tracks.genre[]`
- Click a genre → filtered track grid for that genre

---

#### 6.3 Audio Player

Persistent **bottom bar**, always visible on all public and admin pages:

- Play / Pause / Previous / Next
- Seek bar with elapsed time and total duration
- Volume slider + mute toggle
- Track title + top-line personnel summary
- **Slideshow button** — enters fullscreen photo mode
- Queue: plays through the current browse view's track order

**Keyboard shortcuts:**
- `Space` — play / pause
- `← / →` — seek ±10 seconds
- `M` — mute toggle
- `Esc` — exit slideshow mode

---

#### 6.4 Band Photo Slideshow

Triggered when the user hits the Slideshow button while audio is playing:

- Fills the viewport above the player bar
- On load, fetches all photos where `featured = true`
- Shuffled randomly client-side using Fisher-Yates
- Cycles through photos every 5 seconds with CSS crossfade transition
- **Pauses** when audio pauses, **resumes** when audio resumes
- Shuffle does not reset when track changes
- Caption bar (bottom-left) shows `caption · location · photo_date` if populated; hidden if all fields are empty
- Dismiss button (top-right) returns to catalog without stopping playback
- If photo library is empty: shows a full-screen logo placeholder — never a broken state

---

### 7. Admin Features

---

#### 7.1 Bulk Audio Upload

**Stage 1 — Drop Zone**
- Drag-and-drop accepting multiple files simultaneously (`.mp3`, `.flac`, `.wav`, `.m4a`, `.ogg`)
- File list below drop zone shows filename and file size
- "Upload All" begins the batch

**Stage 2 — Upload & Extraction**

For each file (max 3 in parallel):
1. File uploaded to Supabase Storage `audio/tracks/{uuid}.{ext}`
2. Edge Function `extract-metadata` fires, running `music-metadata`:
   - `title` — from ID3 tag, or filename stripped of extension as fallback
   - `album` — from ID3 tag if present
   - `duration_secs` — always extracted
   - `tempo_bpm`, `key`, `genre` — extracted if tagged
3. Draft record written to `tracks` table (`status = 'draft'`)
4. Per-file progress: queued → uploading → extracting → ready

**Stage 3 — Bulk Review Table**

After all files complete, admin lands on an editable table of the batch:
- One row per track
- Columns: title, album, recorded date, genre, duration (read-only), personnel, status
- Every cell is inline-editable
- **Personnel column** opens a popover: add/remove people with instrument + role, typeahead autocomplete from People registry
- **Batch apply:** select multiple rows → set the same album, date, or genre across all in one action
- Row-level actions: publish, delete, open in full editor
- "Publish All" flips all draft rows to `status = 'published'`
- Drafts persist in Admin Track List indefinitely

---

#### 7.2 Admin Track List

- Dense table of **all tracks** including drafts
- Sortable columns, bulk row select
- Bulk actions: publish, unpublish, delete, apply genre tag, apply album name
- Quick inline edit for title and date in the table
- Click row → opens full Track Metadata Editor

---

#### 7.3 Track Metadata Editor

Full-page edit form for a single track:
- All taxonomy fields: title, album, recorded date, released date, genre tags, musical key, BPM, liner notes
- **Personnel section:** full list with instrument, role, session notes per person; add/remove rows; typeahead from People registry
- Replace audio file (re-uploads to Storage, updates `storage_path`)
- Add or replace cover art
- Toggle `status` between draft and published
- Delete track — removes Storage file and DB record, with confirmation dialog

---

#### 7.4 Photo Upload & Management

**Upload Flow**

1. **Drop Zone** — drag multiple photos at once (`.jpg`, `.png`, `.webp`)
2. **Thumbnail preview grid** appears immediately via `URL.createObjectURL` — no upload yet
3. `exifr` runs client-side on each photo, auto-populating:
   - `photo_date` from EXIF `DateTimeOriginal`
   - `location` from GPS coordinates (reverse geocoded via Nominatim)
4. **Metadata review grid** — each photo card shows thumbnail + editable fields:
   - Caption
   - Date taken (pre-filled from EXIF, editable)
   - Location (pre-filled if GPS available, editable)
   - Event name (e.g. "Summer Tour 2023")
   - People in photo (tag picker from People registry)
   - Featured toggle (default: on)
5. **Batch apply** — select multiple photos, apply same date / location / event in one action
6. "Upload All" fires — photos upload to `photos/band/{uuid}.{ext}`, records written to DB

**Managing Existing Photos**
- Grid of all photos in the library
- Filter by: event name, date range, person, featured status
- Inline edit any metadata field
- Toggle `featured` without deleting
- Add/remove person tags after the fact
- Delete photo — removes Storage file and DB record

---

#### 7.5 People Registry

- List of all people with track count and photo count
- Edit name and bio inline
- **Merge duplicates:** select two records → merge into one, all `track_personnel` and `photo_people` rows reassigned
- Click a person → see all tracks and photos they appear in

---

#### 7.6 Invite Admin

- Simple form: email address input + "Send Invitation" button
- Calls `supabase.auth.admin.inviteUserByEmail(email)`
- Supabase sends the invite email automatically
- Pending invitations list: email + sent date
- Current admins list: email + who invited them + date joined
- Admins can revoke access by deleting user from `admin_users` and `auth.users`

---

### 8. Edge Functions

| Function | Trigger | What It Does |
|---|---|---|
| `extract-metadata` | Called after audio file upload | Runs `music-metadata` (via `npm:music-metadata` Deno specifier) on the uploaded file, writes extracted fields to the `tracks` draft record |

All other data operations use the Supabase JS client calling PostgREST directly from the frontend — no custom server needed.

---

### 9. Frontend Component Tree

```
App
├── PublicLayout
│   ├── Nav (Browse links)
│   ├── CatalogPage /
│   │   ├── FilterSidebar
│   │   ├── TrackGrid / TrackList
│   │   │   └── TrackCard
│   │   └── TrackDetailDrawer
│   ├── BrowseTimelinePage /browse/timeline
│   ├── BrowsePlayersPage /browse/players
│   │   └── PlayerProfilePage /browse/players/:id
│   ├── BrowseInstrumentsPage /browse/instruments
│   ├── BrowseAlbumsPage /browse/albums
│   │   └── AlbumDetailPage /browse/albums/:id
│   ├── BrowseGenresPage /browse/genres
│   └── Player (persistent bottom bar)
│       └── SlideshowOverlay (fullscreen, toggled)
│
├── AuthPages
│   ├── LoginPage /admin/login
│   └── AcceptInvitePage /admin/accept-invite
│
└── AdminLayout (auth-gated)
    ├── AdminNav
    ├── BulkUploadPage /admin/upload
    │   ├── DropZone
    │   ├── UploadProgressList
    │   └── BulkReviewTable
    │       └── PersonnelPopover
    ├── TrackListPage /admin/tracks
    ├── TrackEditorPage /admin/tracks/:id
    ├── PhotosPage /admin/photos
    │   ├── PhotoDropZone
    │   ├── PhotoReviewGrid
    │   └── PhotoLibraryGrid
    ├── PeoplePage /admin/people
    └── InvitePage /admin/invite
```

---

### 10. Project File Structure

```
tresvant/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── lib/
│   │   │   └── supabase.js          # Supabase JS client init
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── usePlayer.js
│   │   │   ├── useSlideshow.js
│   │   │   └── useUploadQueue.js
│   │   ├── components/
│   │   │   ├── catalog/
│   │   │   │   ├── TrackCard.jsx
│   │   │   │   ├── TrackGrid.jsx
│   │   │   │   ├── TrackDetailDrawer.jsx
│   │   │   │   └── FilterSidebar.jsx
│   │   │   ├── browse/
│   │   │   │   ├── Timeline.jsx
│   │   │   │   ├── PlayerRoster.jsx
│   │   │   │   ├── PlayerProfile.jsx
│   │   │   │   ├── InstrumentBrowser.jsx
│   │   │   │   ├── AlbumGrid.jsx
│   │   │   │   └── GenreCloud.jsx
│   │   │   ├── player/
│   │   │   │   ├── PlayerBar.jsx
│   │   │   │   └── SlideshowOverlay.jsx
│   │   │   └── admin/
│   │   │       ├── DropZone.jsx
│   │   │       ├── BulkReviewTable.jsx
│   │   │       ├── PersonnelPopover.jsx
│   │   │       ├── TrackEditor.jsx
│   │   │       ├── PhotoDropZone.jsx
│   │   │       ├── PhotoReviewGrid.jsx
│   │   │       ├── PhotoLibraryGrid.jsx
│   │   │       ├── PeopleManager.jsx
│   │   │       └── InvitePanel.jsx
│   │   └── pages/
│   │       ├── Catalog.jsx
│   │       ├── browse/
│   │       │   ├── Timeline.jsx
│   │       │   ├── Players.jsx
│   │       │   ├── Instruments.jsx
│   │       │   ├── Albums.jsx
│   │       │   └── Genres.jsx
│   │       ├── admin/
│   │       │   ├── BulkUpload.jsx
│   │       │   ├── TrackList.jsx
│   │       │   ├── TrackEditor.jsx
│   │       │   ├── Photos.jsx
│   │       │   ├── People.jsx
│   │       │   └── Invite.jsx
│   │       ├── Login.jsx
│   │       └── AcceptInvite.jsx
│   └── vite.config.js
│
├── supabase/
│   ├── functions/
│   │   └── extract-metadata/
│   │       └── index.ts
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_admin_users.sql
│
└── CLAUDE.md
```

---

### 11. CLAUDE.md Contents

The root `CLAUDE.md` should document:

- Project purpose and band context
- Supabase project URL and anon key (reference env vars, never hardcode)
- How to run frontend dev server: `npm run dev`
- How to deploy Edge Functions: `supabase functions deploy extract-metadata`
- How to bootstrap the first admin: manually via Supabase Auth dashboard, then insert into `admin_users`
- Schema overview with table relationships
- Storage bucket names and public URL pattern
- RLS policy intent per table
- Concurrency limit on bulk audio upload (3 parallel)
- `music-metadata` Deno import specifier: `npm:music-metadata`
- `exifr` runs client-side — GPS reverse geocoding uses Nominatim (no API key required, respect rate limits)
- Known gotcha: invite links expire in 24 hours (configurable in Supabase Auth settings)
- Known gotcha: `music-metadata` extraction quality varies — ID3v2 tags on MP3s are reliable, WAV and FLAC may have sparse tags

---

### 12. Out of Scope (v1)

- Self-registration or public user accounts
- Cloud storage beyond Supabase Storage (no S3, no GCS)
- Waveform visualization (deferred to v2)
- Lyrics or chord charts
- External integrations (Spotify, MusicBrainz, Last.fm)
- Mobile native app
- Comments or reactions on tracks
- Email notifications beyond invite emails

---

### 13. Build Order for Claude Code

1. Supabase migrations — schema, RLS policies, admin_users table
2. Storage buckets — audio and photos, both public
3. Supabase Auth configuration — disable public signups, enable invite flow
4. `extract-metadata` Edge Function
5. Supabase JS client init + `useAuth` hook + auth gate HOC
6. Login page + Accept Invite page
7. Public catalog page — grid, filter sidebar, search
8. Track Detail Drawer
9. Persistent bottom-bar Player (HTML5 Audio API)
10. Slideshow Overlay — shuffle, crossfade, pause sync, caption bar
11. Browse — Timeline view
12. Browse — Players roster + Player Profile page
13. Browse — Instruments, Albums, Genres views
14. Admin — Bulk Upload drop zone + progress list
15. Admin — Bulk Review Table with inline editing + Personnel Popover + batch apply
16. Admin — Track List page
17. Admin — Track Metadata Editor
18. Admin — Photo Upload with EXIF extraction + metadata review grid
19. Admin — Photo Library management
20. Admin — People Registry + merge duplicates
21. Admin — Invite page
22. Polish — empty states, error handling, loading skeletons, mobile layout, keyboard shortcuts
