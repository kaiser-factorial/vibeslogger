# vibelogger

mood tracking on the russell circumplex model (valence × arousal), with auth so multiple people can use it.

live: `https://<your-project>.vercel.app`

---

## setup

### 1. supabase

1. create a project at [supabase.com](https://supabase.com)
2. run this SQL in the SQL editor:

```sql
create table vibes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users not null,
  valence     float not null check (valence between 1 and 10),
  arousal     float not null check (arousal between 1 and 10),
  note        text,
  created_at  timestamptz default now()
);

alter table vibes enable row level security;

create policy "users can view own vibes"
  on vibes for select using (auth.uid() = user_id);

create policy "users can insert own vibes"
  on vibes for insert with check (auth.uid() = user_id);

create policy "users can delete own vibes"
  on vibes for delete using (auth.uid() = user_id);
```

3. in supabase: **Authentication → URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs** (do this after step 3 below once you have the URL). also add `http://localhost:5173` to Redirect URLs for local dev.

4. grab your project URL and anon key from **Settings → API**

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
5. deploy — vercel auto-deploys on every push to `main`

---

## stack

- **vite + react** — frontend build
- **supabase** — auth (magic link) + postgres + row-level security
- **github actions** — ci/cd to github pages

## coordinate system

- x axis: valence 1–10 (unpleasant → pleasant)  
- y axis: arousal 1–10 (low energy → high energy)
