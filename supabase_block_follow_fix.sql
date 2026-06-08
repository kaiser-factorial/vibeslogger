-- Run this once in the Supabase SQL editor (after supabase_social_setup.sql)
-- to close the gap documented in SPEC.md §3/§9: blocking only ever filtered
-- what the *blocker* sees — it didn't stop the blocked user from following
-- (or continuing to follow) the blocker.

-- ── 1. Stop NEW follows from someone you've blocked ─────────────────────────
-- RESTRICTIVE policies are AND'ed with permissive ones, so this narrows the
-- existing "auth.uid() = follower_id" INSERT check without needing to know,
-- rename, or drop it — same additive philosophy as the follows SELECT policy
-- in supabase_social_setup.sql, just using AND instead of OR.
create policy "cannot follow someone who has blocked you"
  on follows as restrictive
  for insert
  to authenticated
  with check (
    not exists (
      select 1 from blocks
      where blocker_id = followee_id and blocked_id = follower_id
    )
  );

-- ── 2. Retroactively sever any EXISTING reverse-follow on block ─────────────
-- When A blocks B, immediately delete any row where B already follows A.
-- security definer lets the trigger bypass the (now-restrictive) follows RLS
-- for this one targeted delete; search_path is pinned for safety.
create or replace function remove_follow_on_block()
returns trigger as $$
begin
  delete from follows
  where follower_id = new.blocked_id and followee_id = new.blocker_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_block_remove_existing_follow
  after insert on blocks
  for each row execute function remove_follow_on_block();

-- After this runs: blocking someone immediately removes their follow on you,
-- and they can never re-follow you while the block stands. Unblocking does
-- NOT restore the follow — they'd need to follow you again themselves, which
-- matches the "blocking is a clean break" expectation.
