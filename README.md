# vibelogger

mood tracking on the russell circumplex model (valence × arousal), with auth so multiple people can use it.

live: `https://<your-project>.vercel.app`

---

## setup

### 1. supabase

1. create a project at [supabase.com](https://supabase.com)
2. run this SQL in the SQL editor to create the core `vibes` table:

```sql
create table vibes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users not null,
  valence     float not null check (valence between 1 and 10),
  arousal     float not null check (arousal between 1 and 10),
  note        text,
  public      boolean default true,
  note_public boolean default false,
  created_at  timestamptz default now()
);

alter table vibes enable row level security;

create policy "vibes are viewable by owner or if public"
  on vibes for select using (auth.uid() = user_id or public = true);

create policy "users can insert own vibes"
  on vibes for insert with check (auth.uid() = user_id);

create policy "users can update own vibes within 3 hours"
  on vibes for update using (auth.uid() = user_id and created_at > now() - interval '3 hours');

create policy "users can delete own vibes within 3 hours"
  on vibes for delete using (auth.uid() = user_id and created_at > now() - interval '3 hours');
```

3. set up the social layer — `profiles` (with the `on_auth_user_created` signup trigger), `follows`, and `blocks`. The full schema, RLS policies, and rationale for each table live in [`SPEC.md` §3](./SPEC.md#3-database-schema). `blocks` plus an additive `follows` visibility policy can be applied in one shot by running [`supabase_social_setup.sql`](./supabase_social_setup.sql) in the SQL editor (run it *after* `profiles`/`follows` exist).
4. in supabase: **Authentication → URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs** (do this after step 3 below once you have the URL). also add `http://localhost:5173` to Redirect URLs for local dev.

5. grab your project URL and anon key from **Settings → API**

### 2. local dev

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

### 3. vercel deployment

1. push repo to github
2. go to [vercel.com](https://vercel.com) → New Project → import your repo
3. framework preset auto-detects as Vite — no build config changes needed
4. add environment variables under **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - set both for Production, Preview, and Development environments
5. deploy — vercel auto-deploys on every push to `master`

---

## stack

- **vite + react + typescript** — frontend build (strict mode)
- **supabase** — auth (magic link + password) + postgres + row-level security
- **vercel** — hosting, auto-deploy on push to `master`
- **github actions** — CI (typecheck + test suite) on PRs and pushes to `master`
- **vitest** — test suite (logic, hooks, components)

## coordinate system

- x axis: valence 1–10 (unpleasant → pleasant)  
- y axis: arousal 1–10 (low energy → high energy)

See [`SPEC.md`](./SPEC.md) for the full project specification — schema, zone system, feature inventory, architectural decisions, and roadmap.
