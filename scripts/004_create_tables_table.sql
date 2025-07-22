-- Tables (mahjong tables within rooms)
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, playing, finished
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table players
CREATE TABLE IF NOT EXISTS table_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  position VARCHAR(10) NOT NULL, -- 東, 南, 西, 北
  seat_order INTEGER NOT NULL,
  current_score INTEGER DEFAULT 25000,
  UNIQUE(table_id, user_id),
  UNIQUE(table_id, position)
);

-- Games (individual rounds/hands)
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  round_name VARCHAR(20) NOT NULL, -- 東1局, 東2局, etc.
  round_number INTEGER NOT NULL,
  winner_id UUID REFERENCES users(id),
  loser_id UUID REFERENCES users(id), -- for ron, null for tsumo
  han INTEGER,
  fu INTEGER,
  score INTEGER,
  is_draw BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game scores (score changes for each player in a game)
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score_change INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  riichi BOOLEAN DEFAULT FALSE,
  chips INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tables_room_id ON tables(room_id);
CREATE INDEX IF NOT EXISTS idx_table_players_table_id ON table_players(table_id);
CREATE INDEX IF NOT EXISTS idx_games_table_id ON games(table_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
