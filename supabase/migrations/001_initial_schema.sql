-- Coin Clicker PostgreSQL Schema (Supabase)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  short_description TEXT DEFAULT 'Clicking my way to #1!',
  country TEXT DEFAULT 'VN',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Player Stats Table
CREATE TABLE IF NOT EXISTS public.player_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_energy BIGINT DEFAULT 0 CHECK (current_energy >= 0),
  total_earned_energy BIGINT DEFAULT 0 CHECK (total_earned_energy >= 0),
  leaderboard_score BIGINT DEFAULT 0 CHECK (leaderboard_score >= 0),
  best_combo INT DEFAULT 0,
  current_combo INT DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Items Configuration Table
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('click_power', 'passive')),
  base_price BIGINT NOT NULL,
  price_growth NUMERIC NOT NULL,
  base_production BIGINT DEFAULT 0,
  click_multiplier NUMERIC DEFAULT 1.0,
  unlock_requirement BIGINT DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Player Items (Inventory / Levels)
CREATE TABLE IF NOT EXISTS public.player_items (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
  level INT DEFAULT 0 CHECK (level >= 0),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- 5. Leaderboard Entries
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_id UUID,
  score BIGINT DEFAULT 0 CHECK (score >= 0),
  period_type TEXT NOT NULL CHECK (period_type IN ('global', 'daily', 'weekly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- 6. Seasons Table
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'upcoming')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Player Sessions (Anti-Cheat tracking)
CREATE TABLE IF NOT EXISTS public.player_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  status TEXT DEFAULT 'active'
);

-- 8. FCM Tokens
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- 9. Player Rank History (Personal historical standing)
CREATE TABLE IF NOT EXISTS public.player_rank_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  rank INT NOT NULL,
  score BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Period Winners (Weekly Top 1 Hall of Fame Archive)
CREATE TABLE IF NOT EXISTS public.period_winners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  period_type TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_username TEXT NOT NULL,
  snapshot_description TEXT,
  country TEXT DEFAULT 'VN',
  final_score BIGINT NOT NULL,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_type, period_start)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_player_stats_score ON public.player_stats(leaderboard_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_query ON public.leaderboard_entries(period_type, period_start, score DESC);
CREATE INDEX IF NOT EXISTS idx_player_rank_history_user ON public.player_rank_history(user_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_period_winners_period ON public.period_winners(period_type, period_start DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_rank_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public stats are viewable by everyone" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "Items are viewable by everyone" ON public.items FOR SELECT USING (true);
CREATE POLICY "Leaderboard entries are viewable by everyone" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Period winners are viewable by everyone" ON public.period_winners FOR SELECT USING (true);

-- User Self-Management Policies
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can update own stats" ON public.player_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.player_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own items" ON public.player_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own items" ON public.player_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own rank history" ON public.player_rank_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own fcm tokens" ON public.fcm_tokens FOR ALL USING (auth.uid() = user_id);

-- Initial Items Seed Data
INSERT INTO public.items (id, slug, name, description, type, base_price, price_growth, base_production, click_multiplier, unlock_requirement, sort_order)
VALUES
  ('item_earth_clicker', 'earth_clicker', 'Earth Clicker', 'Makes your clicks significantly more powerful.', 'click_power', 2000, 1.65, 0, 2.0, 0, 1),
  ('item_campfire', 'campfire', 'Campfire', 'Produces 1 ⚡ per second.', 'passive', 152, 1.15, 1, 1.0, 0, 2),
  ('item_farm', 'farm', 'Farm', 'Produces 10 ⚡ per second.', 'passive', 800, 1.15, 10, 1.0, 0, 3),
  ('item_animal_farm', 'animal_farm', 'Animal Farm', 'Produces 120 ⚡ per second.', 'passive', 10000, 1.15, 120, 1.0, 10000, 4),
  ('item_windmill', 'windmill', 'Windmill', 'Produces 1,000 ⚡ per second.', 'passive', 75000, 1.15, 1000, 1.0, 75000, 5),
  ('item_factory', 'factory', 'Factory', 'Produces 5,000 ⚡ per second.', 'passive', 250000, 1.15, 5000, 1.0, 250000, 6)
ON CONFLICT (id) DO NOTHING;
