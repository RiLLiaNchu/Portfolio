-- 既存のテーブルに外部キー制約を追加

-- rooms テーブルの外部キー制約
ALTER TABLE rooms 
DROP CONSTRAINT IF EXISTS rooms_created_by_fkey,
ADD CONSTRAINT rooms_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- room_members テーブルの外部キー制約
ALTER TABLE room_members 
DROP CONSTRAINT IF EXISTS room_members_room_id_fkey,
ADD CONSTRAINT room_members_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE room_members 
DROP CONSTRAINT IF EXISTS room_members_user_id_fkey,
ADD CONSTRAINT room_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- tables テーブルの外部キー制約（存在する場合）
ALTER TABLE tables 
DROP CONSTRAINT IF EXISTS tables_room_id_fkey,
ADD CONSTRAINT tables_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- インデックスも追加
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
