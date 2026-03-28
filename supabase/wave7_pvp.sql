-- WAVE 7: PvP Arena

CREATE TABLE IF NOT EXISTS pvp_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES characters(id),
  player2_id UUID REFERENCES characters(id),
  winner_id UUID REFERENCES characters(id),
  player1_hp_remaining INTEGER,
  player2_hp_remaining INTEGER,
  turns_total INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pvp_stats (
  character_id UUID PRIMARY KEY REFERENCES characters(id),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 1000,
  highest_rating INTEGER DEFAULT 1000,
  win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  total_damage_dealt BIGINT DEFAULT 0,
  total_damage_received BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pvp_rating_history (
  id SERIAL PRIMARY KEY,
  character_id UUID REFERENCES characters(id),
  old_rating INTEGER,
  new_rating INTEGER,
  rating_change INTEGER,
  match_id UUID REFERENCES pvp_matches(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pvp_weekly_rewards (
  id SERIAL PRIMARY KEY,
  character_id UUID REFERENCES characters(id),
  week_start DATE,
  wins INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  diamonds_earned INTEGER DEFAULT 0,
  claimed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pvp_stats_rating   ON pvp_stats(rating DESC);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_created ON pvp_matches(created_at DESC);

-- Verificação
SELECT
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('pvp_matches','pvp_stats','pvp_rating_history','pvp_weekly_rewards')) AS new_tables,
  (SELECT count(*) FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname IN ('idx_pvp_stats_rating','idx_pvp_matches_created')) AS new_indexes;
