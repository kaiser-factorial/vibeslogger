# vibelogger — handoff document

Mood tracker using the **Russell Circumplex Model of Affect**: a 2D grid where
x = valence (unpleasant → pleasant) and y = arousal (low energy → high energy).
Each logged entry is a point in that space with an optional text note.
Multi-user via Supabase auth; everyone's data is private.

---

## stack

| Layer      | Tool                                  |
|------------|---------------------------------------|
| Frontend   | Vite + React 18                       |
| Auth + DB  | Supabase (magic link, Postgres + RLS) |
| Hosting    | Vercel (auto-deploys from `main`)     |
| Styling    | Plain CSS (single `index.css`)        |

---

## project structure

```
vibelogger/
├── src/
│   ├── App.jsx                 # root: auth state, layout mode, modal gate
│   ├── main.jsx                # React DOM entry
│   ├── index.css               # all styles; mobile breakpoints at bottom
│   │
│   ├── lib/
│   │   ├── supabase.js         # createClient — reads VITE_SUPABASE_* env vars
│   │   └── vibeColor.js        # (valence, arousal) → HSL color string
│   │
│   ├── hooks/
│   │   └── useVibes.js         # fetch / addVibe / deleteVibe; optimistic updates
│   │
│   └── components/
│       ├── Auth.jsx            # magic-link sign-in form
│       ├── MoodGrid.jsx        # clickable 2D grid; zone backgrounds + SVG dots
│       ├── MoodModal.jsx       # note entry, shown as a centred overlay
│       └── MoodTable.jsx       # chronological log table with 2-click delete
│
├── .env.example                # copy to .env for local dev
├── vite.config.js              # base: '/' (Vercel); change for other hosts
├── package.json
├── README.md                   # setup walkthrough (Supabase SQL, Vercel vars)
└── HANDOFF.md                  # this file
```

---

## local dev setup

```bash
cp .env.example .env          # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev                   # http://localhost:5173
```

Full Supabase setup (table + RLS) is in **README.md**.

---

## data model

```sql
table: vibes
  id          uuid    PK, gen_random_uuid()
  user_id     uuid    FK → auth.users (NOT NULL)
  valence     float   1–10  (unpleasant → pleasant)
  arousal     float   1–10  (low → high energy)
  note        text    nullable
  created_at  timestamptz  default now()

RLS: users can only SELECT / INSERT / DELETE their own rows (auth.uid() = user_id)
```

---

## architecture notes

**Layout state machine (`App.jsx`)**
Two modes: `landing` (centered grid, no table) and `expanded` (grid left, table
right). Transitions to `expanded` on first click or if the user has existing
vibes. A `localStorage` hint (`vl-has-vibes`) can skip the flash on return
visits — not yet wired in, see TODO below.

**Auth flow**
Magic link only — no passwords. User enters email → Supabase emails a one-time
link → clicking it redirects to the app with a hash token → Supabase v2 client
auto-processes the hash → `onAuthStateChange` fires → session is set.
Works across devices: data lives in Supabase; a new device just needs a fresh
magic link.

**Optimistic updates (`useVibes.js`)**
`addVibe` and `deleteVibe` update local state immediately then write to Supabase.
No polling or realtime subscription — simple and sufficient for a personal tool.
Add realtime if you want cross-tab sync.

**Color encoding (`vibeColor.js`)**
```
hue       = (valence - 1) / 9 * 120    →  0° (red) to 120° (green)
lightness = 25 + (arousal - 1) / 9 * 40  →  25% (dim) to 65% (bright)
saturation = 80% (fixed)
```
Zone backgrounds are hardcoded territorial colors; only the plotted dots use
this encoding.

**Mobile**
Grid stacks above the table on `max-width: 768px`. Grid height is `60vw`
(expanded) / `70vw` (landing) so it stays visible without scrolling. Zone
labels scale to `0.58×` via `useIsMobile` in `MoodGrid`.

---

## environment variables

| Variable              | Where to set                                      |
|-----------------------|---------------------------------------------------|
| `VITE_SUPABASE_URL`   | `.env` locally; Vercel project env vars           |
| `VITE_SUPABASE_ANON_KEY` | `.env` locally; Vercel project env vars        |

These are safe to expose in frontend code — they're the public anon key, not
the service role key. RLS enforces data isolation.

---

## vercel deployment

1. Import repo on vercel.com
2. Framework preset auto-detected as Vite — no config needed
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under
   **Settings → Environment Variables**
4. In Supabase: **Authentication → URL Configuration** → add your
   `https://your-project.vercel.app` to Site URL and Redirect URLs
5. Push to `main` — deploys automatically

> `vite.config.js` sets `base: '/'` — correct for Vercel. If you ever move
> to GitHub Pages under a sub-path (e.g. `/vibelogger/`), update accordingly.

---

## what's implemented

- [x] Magic link auth (sign in / sign out)
- [x] Circumplex grid with labeled zones
- [x] Click-to-log with note entry modal
- [x] Chronological log table
- [x] Per-point color encoding (valence × arousal → HSL)
- [x] Optimistic updates
- [x] Mobile-responsive layout (stacked, scaled labels)
- [x] Touch interaction (`touch-action: manipulation`)
- [x] Row-level security (each user sees only their own data)

---

## known gaps / todos

- [ ] `localStorage` hint to skip landing flash on return visits
      (`App.jsx` comment explains the pattern)
- [ ] Edit note after logging
- [ ] Date range filter / pagination on the table
- [ ] History visualisations (heatmap, time-series, zone frequency)
- [ ] CSV / JSON export
- [ ] Haptic feedback on mobile tap
- [ ] Undo delete (currently 2-click confirm, no undo)
- [ ] PWA manifest for "add to home screen" on mobile

---

## key files to read first

If you're orienting quickly, read in this order:

1. `src/App.jsx` — layout state, auth wiring, how components connect
2. `src/hooks/useVibes.js` — all data operations
3. `src/lib/vibeColor.js` — the color math (small but central)
4. `src/components/MoodGrid.jsx` — main interactive surface
