# CLAUDE_IDEAS.md

ideas I came up with during development — separate from what was explicitly requested.
"implemented" = shipped; "not implemented" = documented for potential future discussion.

---

## implemented (not explicitly requested)

### stats strip in analysis panel
four stat pills at the top of the analysis view: total entries, avg valence, avg arousal, and
notes with 3+ words. the last one gives context for why the word analysis may be sparse.
*why:* feels natural alongside the visuals; lets you get a numeric feel for the filtered slice
before diving into charts.

### heatmap color legend
a small gradient strip (none → most) under the heatmap.
*why:* the heat opacity mapping isn't obvious without it.

### lock gate progress bar
the "unlock at 10 entries" screen shows a fill bar rather than just a number.
*why:* progress bars are motivating; makes the gate feel like a milestone rather than a wall.

### google fonts import in index.html
added the `<link>` for IBM Plex Mono. it was referenced in CSS but never loaded from a source,
so the app was silently falling back to Courier New everywhere.
*why:* the font is central to the vibe; not loading it was a quiet bug.

### undo delete
replaced the 2-click confirm with a 5-second undo toast. the row disappears immediately (optimistic),
a sticky toast shows "entry deleted · undo (Xs)" with a live countdown, and the real Supabase DELETE
fires only when the timer expires. all state in `MoodTable` — no hook changes needed.
*why:* two-click confirm was unnecessary friction; this feels snappier and recoverable.

### export CSV
"↓ csv" button in the analysis filter row, disabled when the filtered set is empty. exports only
the currently filtered slice so date filters compose naturally with the download.
headers: date, time, valence, arousal, zone, note.
*why:* basic data ownership; zero-dependency browser-native Blob + anchor approach.

### trend line
daily-average valence/arousal sparklines + dashed least-squares regression overlays in the analysis
panel. ↑↓→ direction arrows show trajectory at a glance. appears only when there are ≥2 days of data.
*why:* heatmap shows density but not direction; sparklines show whether things are moving.

### friends / following system
follows table (follower\_id, followee\_id) with RLS. `useFollows` hook with optimistic follow/unfollow.
"similar vibers" section ranks users by cosine-style zone-distribution similarity and shows a follow
button per row. timeline header toggles between everyone / following (N).
*note:* requires the follows SQL to be run in Supabase — see session context for the migration.

---

## not implemented — open for discussion

### streak tracking
show a "current streak" counter: X consecutive days with at least one entry.
could live in the stats strip or in a small badge near the header.
*trade-off:* streak mechanics can feel gamified/pressuring for a mood tracker — worth discussing
whether that's the right energy.

### time-of-day pattern analysis
break down entries by morning / afternoon / evening / night.
"you tend to hit *we vibing* in the evenings" type insight.
*trade-off:* needs a decent volume of data before it's meaningful; could add noise early on.

### emotion wheel overlay
overlay Russell's canonical affect labels (excited, happy, content, serene, sad, bored,
distressed, tense) as a semi-transparent legend on the main grid. togglable.
*trade-off:* could de-mystify the coordinates for new users but clutter the grid.

### weekly digest (push or email)
a Supabase Edge Function that emails a weekly summary: avg mood, top zone, a word cloud.
*trade-off:* requires Supabase Functions + email provider setup; scope creep from a
"simple personal tool" toward a service.

### shareable vibe card
generate a small image or OG-card URL for a single entry.
"look at this vibe I logged" → shareable link renders a mini mood grid with one dot.
*trade-off:* needs a serverless function for image generation (e.g. satori/OG-image).

### anonymous aggregate comparison (opt-in)
an opt-in toggle that, when enabled, lets the user see a blurred heatmap of all users'
activity today. gives context for "are other people also having a bad week?"
*trade-off:* significant privacy/ethics surface area; opt-in is essential.

### custom zone labels
let the user rename the seven zones to their own phrases.
stored per-user in a `zone_labels` column or table.
*trade-off:* the existing names are part of the personality of the app; making them
editable dilutes that, but could be great for personal use.

### PWA offline support (service worker)
the manifest is in place but there's no service worker yet, so "add to home screen"
works but the app doesn't function offline.
*trade-off:* a cache-first service worker for a Supabase-backed app needs careful
cache invalidation strategy. worth doing once the data model is stable.

### JSON export option
the current export is CSV-only; a JSON download would preserve types (no string-coercion of numbers)
and be easier to re-import or pass to a script.
*trade-off:* most spreadsheet users expect CSV; could add a second button or a dropdown picker.

### timeline pagination / cursor loading
the timeline currently fetches all public entries in one query. fine now, will break at scale.
options: offset pagination (cheap to add, bad for live feeds) or cursor-based (better for real-time).
*trade-off:* adds complexity to `useTimeline`; worth revisiting once there are >500 rows.

### trend window selector
the sparkline shows the full filtered range; a quick-select (7d / 30d / all) in the trends section
would let users focus on recent trajectory without touching the main date filters.
*trade-off:* the date filters already cover this; a dedicated selector is a convenience, not a blocker.

### mutual follows / follow-back indicator
show a "follows you back" badge next to usernames in similar vibers when the relationship is mutual.
*trade-off:* requires a second query or a join; adds social-graph complexity.

### follower-count display
show each user's follower count in similar vibers so users know who's popular.
*trade-off:* could create a popularity hierarchy that feels at odds with the personal/introspective
tone of the app.
