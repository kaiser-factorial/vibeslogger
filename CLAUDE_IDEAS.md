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

### trend line on valence/arousal over time
a simple sparkline or linear regression showing whether your average valence or arousal
has been trending up or down over a configurable window (last 7 days, 30 days, etc).
*trade-off:* React + pure CSS is fine for sparklines but may push toward a charting library.

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

### undo delete
replace the 2-click confirm with a brief undo toast (5-second window before the delete
actually commits to Supabase).
*trade-off:* needs a timeout + cancel mechanic; small UX win.

### export (CSV / JSON)
a button in the analysis panel that downloads all (or filtered) entries.
*trade-off:* trivial to implement; just haven't done it yet.
