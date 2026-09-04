-- =========================================================================
-- COIN CLICKER: CLEAR ALL DATA (CLEAN SLATE)
-- Run this script in the Supabase SQL Editor if you wish to wipe all user
-- records, stats, history, and period winners without seeding fake data.
-- =========================================================================

-- 1. Truncate all dynamic player tables with CASCADE
TRUNCATE TABLE IF EXISTS public.player_rank_history CASCADE;
TRUNCATE TABLE IF EXISTS public.period_winners CASCADE;
TRUNCATE TABLE IF EXISTS public.leaderboard_entries CASCADE;
TRUNCATE TABLE IF EXISTS public.player_items CASCADE;
TRUNCATE TABLE IF EXISTS public.player_stats CASCADE;
TRUNCATE TABLE IF EXISTS public.fcm_tokens CASCADE;
TRUNCATE TABLE IF EXISTS public.profiles CASCADE;

-- Note: The static `items` catalog table (Campfire, Farm, Windmill, etc.)
-- is preserved so the shop items remain functional.
