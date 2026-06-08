-- ── Streak stats RPC ──────────────────────────────────────────────────────────
-- Returns current_streak and longest_streak for the calling user.
-- SECURITY INVOKER means it runs as the authenticated user, so RLS on `vibes`
-- automatically limits results to their own rows — no uid param needed.
-- Pass the browser timezone (e.g. 'America/New_York') so day boundaries
-- match the user's local midnight rather than UTC midnight.

CREATE OR REPLACE FUNCTION public.get_streak_stats(tz text DEFAULT 'UTC')
RETURNS TABLE(current_streak integer, longest_streak integer)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  WITH
  -- One row per distinct calendar day the user logged anything
  days AS (
    SELECT DISTINCT (created_at AT TIME ZONE tz)::date AS d
    FROM vibes
  ),
  -- Island/gap trick: consecutive dates share the same `grp` date
  -- because row_number increments at the same rate as the date itself
  grouped AS (
    SELECT d,
           d - (ROW_NUMBER() OVER (ORDER BY d))::integer AS grp
    FROM days
  ),
  -- Each consecutive run: how long, and when it ends
  runs AS (
    SELECT grp,
           COUNT(*)::integer              AS run_len,
           MIN(d)                         AS run_start,
           MAX(d)                         AS run_end
    FROM grouped
    GROUP BY grp
  ),
  -- The active run: ends today or yesterday (streak still counts if not yet
  -- logged today — gives motivation to maintain it before midnight)
  current_run AS (
    SELECT run_len
    FROM runs
    WHERE run_end >= (NOW() AT TIME ZONE tz)::date - 1
    ORDER BY run_end DESC
    LIMIT 1
  )
  SELECT
    COALESCE((SELECT run_len FROM current_run), 0) AS current_streak,
    COALESCE((SELECT MAX(run_len) FROM runs),   0) AS longest_streak
$$;

GRANT EXECUTE ON FUNCTION public.get_streak_stats(text) TO authenticated;
