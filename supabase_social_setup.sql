-- Run this in the Supabase SQL editor (Project → SQL Editor) before using the
-- new social features (user search, profile views, followers/following lists,
-- mutual-follow badges, block/mute). Safe to run once; re-running will error on
-- "already exists" for the table/policies (drop first if you need to re-apply).

-- ── blocks ───────────────────────────────────────────────────────────────────
-- Lets a user block another user. Blocking hides that user's vibes from your
-- timeline, search results, and similar-vibers, and unfollows them client-side.
create table blocks (
  blocker_id  uuid references auth.users not null,
  blocked_id  uuid references auth.users not null,
  created_at  timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

alter table blocks enable row level security;

-- Only the blocker can see their own block list (the blocked user is never
-- told they've been blocked — same privacy posture as e.g. Twitter mutes).
create policy "users can view own blocks"
  on blocks for select using (auth.uid() = blocker_id);

create policy "users can insert own blocks"
  on blocks for insert with check (auth.uid() = blocker_id);

create policy "users can delete own blocks"
  on blocks for delete using (auth.uid() = blocker_id);

-- ── follows: open up SELECT ──────────────────────────────────────────────────
-- The existing `follows` SELECT policy only lets you see rows where you are the
-- follower (i.e. "who do I follow"). Follower/following counts, follower lists,
-- and "follows you back" badges all require seeing rows where you're the
-- *followee* too — and, for profile views of other users, rows that don't
-- involve you at all. This adds a second permissive SELECT policy (permissive
-- policies are OR'd together, so the existing policy keeps working) that opens
-- follow relationships up to any authenticated user — mirrors the existing
-- `profiles` SELECT policy ("any authenticated user can view profiles").
create policy "follows are viewable by any authenticated user"
  on follows for select
  to authenticated
  using (true);

-- Note: this does NOT prevent a user you've blocked from still following you —
-- that would require a restrictive policy on `follows` INSERT referencing
-- `blocks`, which is riskier to script blindly against a live policy set.
-- Documented as a known limitation (see SPEC.md §9).
