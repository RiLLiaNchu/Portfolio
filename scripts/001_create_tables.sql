-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Room members table
CREATE TABLE IF NOT EXISTS room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Tables (mahjong tables within rooms)
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, playing, finished
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table players
CREATE TABLE IF NOT EXISTS table_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score_change INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  riichi BOOLEAN DEFAULT FALSE,
  chips INTEGER DEFAULT 0
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tables_room_id ON tables(room_id);
CREATE INDEX IF NOT EXISTS idx_table_players_table_id ON table_players(table_id);
CREATE INDEX IF NOT EXISTS idx_games_table_id ON games(table_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Anyone can view rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Room creators can update rooms" ON rooms FOR UPDATE USING (auth.uid() = created_by);

-- Room members policies
CREATE POLICY "Anyone can view room members" ON room_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join rooms" ON room_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can leave rooms" ON room_members FOR DELETE USING (auth.uid() = user_id);

-- Tables policies
CREATE POLICY "Anyone can view tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Room members can create tables" ON tables FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = tables.room_id AND user_id = auth.uid()
  )
);

-- Table players policies
CREATE POLICY "Anyone can view table players" ON table_players FOR SELECT USING (true);
CREATE POLICY "Table members can manage players" ON table_players FOR ALL USING (
  EXISTS (
    SELECT 1 FROM room_members rm
    JOIN tables t ON t.room_id = rm.room_id
    WHERE t.id = table_players.table_id AND rm.user_id = auth.uid()
  )
);

-- Games policies
CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Table members can create games" ON games FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM table_players tp
    WHERE tp.table_id = games.table_id AND tp.user_id = auth.uid()
  )
);

-- Game scores policies
CREATE POLICY "Anyone can view game scores" ON game_scores FOR SELECT USING (true);
CREATE POLICY "Table members can create game scores" ON game_scores FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM table_players tp
    JOIN games g ON g.table_id = tp.table_id
    WHERE g.id = game_scores.game_id AND tp.user_id = auth.uid()
  )
);
