# vibeslogger — Project Specification

**Status:** active development  
**Stack:** Vite + React 18 · Supabase (Postgres + Auth) · Vercel  
**Repo:** `github.com/kaiser-factorial/vibeslogger` (auto-deploys `master` → Vercel)

---

## 1. Concept

Vibeslogger is a mood-tracking web app grounded in the **Russell Circumplex Model of Affect** — a 2D psychological model that maps emotional states along two continuous axes:

- **Valence** (x-axis, 1–10): unpleasant → pleasant
- **Arousal** (y-axis, 1–10): low energy → high energy

Rather than asking users to name an emotion, the app asks them to click a point on a grid. That coordinate maps automatically to one of seven named **zones** with deliberately irreverent labels (see §4). The tone is self-aware internet culture, not clinical wellness.

The app started as a personal logging tool and is expanding toward a lightweight social platform where users can see each other's public mood posts and discover people with similar emotional patterns.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React 18 (SPA) | No SSR, no TypeScript, no test suite |
| Styling | Vanilla CSS (index.css) | IBM Plex Mono throughout; no CSS-in-JS |
| Backend / DB | Supabase (Postgres) | RLS enforces all data isolation |
| Auth | Supabase Auth | Magic link + email/password |
| Hosting | Vercel | GitHub integration, auto-deploy on push to `master` |
| Fonts | IBM Plex Mono via Google Fonts | Loaded in `index.html` |

**Environment variables** (set in Vercel + `.env.local` for local dev):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=    ← anon/public key only, never service role
```

---

## 3. Database Schema

### `vibes`
The core table. One row per mood entry.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | `gen_random_uuid()` |
| `user_id` | uuid | FK → `auth.users.id` |
| `valence` | float | 1.0–10.0 |
| `arousal` | float | 1.0–10.0 |
| `note` | text \| null | free-text annotation |
| `public` | boolean | default `true` — appears in global timeline |
| `note_public` | boolean | default `false` — note shown publicly if both `public` and `note_public` are true |
| `created_at` | timestamptz | set by Supabase |

**RLS policies on `vibes`:**
- `SELECT`: own vibes always readable (`auth.uid() = user_id`) OR `public = true` from any user
- `INSERT`: `auth.uid() = user_id`
- `UPDATE`: own vibes only, and only within 3 hours of creation (`created_at > now() - interval '3 hours'`)
- `DELETE`: same 3-hour window

### `profiles`
Display name store, one row per auth user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | `= auth.users.id` |
| `username` | text | auto-populated as email prefix (before `@`) on signup via trigger |

**RLS on `profiles`:** SELECT by any authenticated user; UPDATE own row only.

A Postgres trigger (`on_auth_user_created`) populates `profiles` automatically on each new signup. Existing users were backfilled with `split_part(email, '@', 1)`.

---

## 4. Zone System

Zones are the core classification concept. Every (valence, arousal) coordinate maps to exactly one zone.

### Zone Map

| ID | Label | Color | Location on grid |
|---|---|---|---|
| `lfg` | LETS FUCKING GOOOO | `#c5b800` | Top-right corner (v≥8.0, a≥8.4) |
| `back` | we are so fucking back | `#4a7a1e` | Top-right quadrant (olive) |
| `ball` | fuck it we ball | `#8a2020` | Top-left quadrant (red) |
| `over` | it's so over | `#407A96` | Bottom-left (light blue) |
| `vibing` | we vibing | `#4896A8` | Bottom-right (sage green) |
| `whatitis` | it is what it is | `#916018` | Center-left band + narrow column (orange, upside-down T) |
| `mwbs` | log off forever | `#484898` | Bottom-left corner (v≤2.4, a≤2.2) |

### Classification Logic (`src/lib/zones.js`)

Split points derived from an SVG mockup (615×615px grid):
- Valence splits: **4.8** (42%), **6.1** (57%), **8.0** (78%)
- Arousal splits: **4.5** (61% from top), **6.1** (43% from top), **8.4** (18% from top)

```js
getZone(valence, arousal):
  if v≥8.0 && a≥8.4   → lfg
  if v≤2.4 && a≤2.2   → mwbs
  if a>6.1             → (v<4.8 ? ball : back)
  if a≥4.5             → (v<6.1 ? whatitis : back)
  if v<4.8             → over
  if v<6.1             → whatitis   // orange column (bottom center)
  else                 → vibing
```

The "it is what it is" zone is intentionally unusual: it forms an upside-down T shape, with a wide horizontal band across the middle of the grid and a narrow column dropping down through the center. This requires two rectangles in the visual layer and two code paths in `getZone`.

### Dot Color Encoding (`src/lib/vibeColor.js`)

Each logged vibe is rendered as a colored dot. Color encodes both dimensions:
- **Hue** = valence (0° = red/unpleasant → 120° = green/pleasant)
- **Saturation** = arousal (35% at low energy → 90% at high)
- **Lightness** = arousal (28% at low energy → 50% at high)

This gives low-arousal states dark, muted colors and high-arousal states bright, vivid ones.

---

## 5. Feature Inventory (current)

### Mood Grid (`src/components/MoodGrid.jsx`)
- Full-viewport clickable grid; click places a pending dot
- SVG overlay renders all logged dots with vibe color encoding
- Zone backgrounds rendered as absolute-positioned divs (using `left/top/right/bottom` %)
- **Labels toggle**: shows/hides zone text labels (Impact font, black, centered per zone)
- **Emotion wheel toggle**: overlays Russell Circumplex affect labels (e.g. "tense", "serene", "excited") as ghosted text at their canonical circumplex positions
- Responsive: scales font sizes at `<768px` via `labelScale = isMobile ? 0.58 : 1`

### Log Modal (`src/components/MoodModal.jsx`)
- Opens on grid click; shows coordinate, optional note textarea
- Word count hint if 1–2 words (notes <3 words are excluded from word analysis)
- **Privacy toggles:**
  - "post to timeline" (default: on) → sets `public` column
  - "include note publicly" (shown only when public + note present) → sets `note_public`
- Enter submits; Escape closes

### Mood Table (`src/components/MoodTable.jsx`)
- Lists all entries for the logged-in user, newest first
- **3-hour edit window**: edit + delete buttons visible for `created_at` within 3 hours; locked indicator (`·`) after that
- Inline note editing: click edit → input replaces note cell → Enter saves, Escape cancels
- Delete requires two clicks (confirm pattern)
- 3-hour lock is enforced both client-side (UI hides buttons) and server-side (RLS UPDATE/DELETE policies)

### Analysis Panel (`src/components/Analysis.jsx`)
- **Locked until 10 entries** (total, not date-filtered) — progress bar shown
- **Date filter**: from/to inputs filter all sections below
- **Stats strip**: entry count, avg valence, avg arousal, note count (≥3 words)
- **Heatmap**: 10×10 grid colored by entry density (opacity scaled to max in current filter window)
- **Zone breakdown**: horizontal bar chart sorted by frequency
- **Word analysis**: top 5 words per zone, stop-words filtered, only notes with ≥3 words counted

### Timeline (`src/components/Timeline.jsx`)
- Global feed of all `public = true` entries from all users
- Each entry: colored dot, zone label (in zone color), `@username`, time-ago, optional note (if `note_public = true`)
- Own entries highlighted subtly
- **Similar vibers**: computes 7-dimensional zone distribution vector per user; ranks all other users by Euclidean distance; shows top 5 with a % match score. Requires ≥5 public entries from current user and ≥3 from candidates to appear.

### Auth (`src/components/Auth.jsx`)
- Two tabs: magic link (OTP email) and email/password
- Sign-up/sign-in toggle in password mode
- `emailRedirectTo: window.location.origin` (not `href` — avoids stale hash issues)

### Set Password Modal (`src/components/SetPasswordModal.jsx`)
- Accessible from header; allows users who signed in via magic link to set a password
- Uses `supabase.auth.updateUser({ password })`

### PWA
- `public/manifest.json` + `public/icon.svg` in place
- Apple meta tags in `index.html`
- **No service worker yet** — "add to home screen" works but app is not offline-capable

---

## 6. Key Architectural Decisions

### RLS as the source of truth
All data isolation is enforced at the Postgres RLS layer, not in application code. The frontend uses the anon key only — no service role key is ever exposed. Client-side checks (e.g. hiding edit buttons after 3 hours) are UX, not security.

### Optimistic updates
`useVibes` applies mutations locally before the Supabase round-trip completes. On error the optimistic update is not rolled back (this is a known gap — low stakes for a personal tool, but worth fixing if the app becomes multi-user-heavy).

### Timeline data fetching strategy
Timeline uses two sequential queries (vibes → profiles for unique user IDs) joined in JS, rather than a PostgREST relationship join. This sidesteps the FK chain (`vibes.user_id → auth.users → profiles`) which PostgREST can't traverse automatically without explicit FK declarations.

### Zone layout
Zone rectangles use `left/top/right/bottom` CSS positioning (not `left/top/width/height`). This avoids subpixel rounding gaps between zones. The orange "whatitis" zone requires two overlapping `z-index: 2` rectangles.

### 3-hour mutation window
`LOCK_AFTER_MS = 3 * 60 * 60 * 1000` in `MoodTable.jsx` matches the RLS policy `created_at > now() - interval '3 hours'`. If this value changes it must be updated in both places.

---

## 7. File Structure

```
src/
  components/
    Auth.jsx              magic link + password auth UI
    Analysis.jsx          full analysis panel (locked until 10 entries)
    MoodGrid.jsx          the clickable 2D grid with zones/dots/overlays
    MoodModal.jsx         post-click entry modal (note + privacy toggles)
    MoodTable.jsx         entries list with inline edit + 3hr lock
    SetPasswordModal.jsx  upgrade magic-link account to password auth
    Timeline.jsx          global feed + similar vibers
  hooks/
    useVibes.js           CRUD for current user's entries (optimistic)
    useTimeline.js        fetches public entries + profiles for timeline
  lib/
    supabase.js           Supabase client init (throws if env vars missing)
    vibeColor.js          HSL color encoding from (valence, arousal)
    wordAnalysis.js       stop-word filtering + top-N word frequency
    zones.js              ZONE_META, ZONE_ORDER, getZone()
  App.jsx                 root: auth gate, nav tabs, layout state
  index.css               all styles (single file, no CSS modules)
  main.jsx                Vite entry point

public/
  manifest.json           PWA manifest
  icon.svg                app icon

index.html                PWA meta tags + Google Fonts link
vite.config.js            base: '/' (Vercel, not GitHub Pages)
CLAUDE_IDEAS.md           ideas log (implemented + proposed)
SPEC.md                   this file
```

---

## 8. Roadmap

Items are loosely ordered by effort/value. Nothing here is committed — all are open for discussion.

### High priority / near-term

**Friends / following system**  
Add a `follows` table (`follower_id`, `followee_id`). Add a "friends timeline" tab that filters the global feed to followed users only. The similar vibers ranking is a natural discovery surface for finding people to follow.

**Export (CSV / JSON)**  
A button in the analysis panel that downloads the current filtered slice. Trivial to implement — just hasn't been done.

**Undo delete**  
Replace the two-click confirm with a 5-second undo toast before actually committing the DELETE to Supabase. Better UX, same net safety.

**Trend line**  
Sparkline or simple linear regression in the analysis panel showing whether avg valence/arousal has trended up or down over a configurable window. May require a lightweight charting library (or hand-rolled SVG path).

### Medium effort

**Streak tracking**  
Count consecutive days with ≥1 entry. Surface as a badge or stat pill. Worth discussing whether streak mechanics fit the mood-tracker context — they can feel pressuring.

**Time-of-day analysis**  
Bucket entries by morning/afternoon/evening/night and show zone distribution per bucket. Needs decent data volume before it's meaningful.

**PWA service worker**  
The manifest is live but there's no service worker. A cache-first strategy for static assets + a queue for offline entries would make the app fully installable. Needs careful cache invalidation once the data model stabilizes.

**Shareable vibe card**  
Generate an OG-image or mini shareable URL for a single entry — a small mood grid with one dot and the zone label. Requires a serverless function (Vercel Edge Function + Satori or similar).

### Longer-term / speculative

**Weekly digest email**  
Supabase Edge Function + email provider (Resend or Postmark). Sends a weekly summary: avg mood, top zone, top words. Significant scope expansion toward a service.

**Anonymous aggregate heatmap (opt-in)**  
An opt-in toggle that shows a blurred heatmap of all users' activity for today. "Are other people also having a bad week?" Significant privacy surface area — opt-in is essential.

**Custom zone labels**  
Per-user rename of the seven zone labels, stored in a `zone_labels` column on `profiles`. The existing names are central to the app's personality, so this would probably be a power-user feature.

**Optimistic update rollback**  
When a Supabase mutation fails, roll back the optimistic local state update in `useVibes`. Currently errors are silent from a UI state perspective.

**Username editing**  
Currently usernames are immutable email prefixes. A simple profile edit form to set a display name would improve the social layer.

---

## 9. Known Gaps & Gotchas

- **No TypeScript.** The codebase is plain JS. Type errors are runtime errors.
- **No test suite.** No unit tests, no integration tests, no E2E.
- **Optimistic updates don't roll back** on error (see §6).
- **Existing vibes got `public = true`** when the column was added (Postgres DEFAULT backfills existing rows). Users have no way to retroactively make old entries private yet — that would need a bulk-edit UI or a migration defaulting existing rows to false.
- **Profile usernames are email prefixes** and currently immutable from the UI.
- **`labelScale` on mobile** scales all label font sizes by 0.58. If label sizes are adjusted, verify at mobile widths.
- **The 3-hour lock constant exists in two places**: `MoodTable.jsx` (client) and the Supabase RLS policy (server). They must stay in sync.
- **No error boundary.** An uncaught render error will crash the whole app.
