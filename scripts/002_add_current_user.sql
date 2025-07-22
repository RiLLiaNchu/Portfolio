-- 現在のユーザーをusersテーブルに追加
INSERT INTO users (id, email, name) VALUES
  ('65f84249-580c-462a-966e-d5ea425658c2', 'srin5ame@gmail.com', 'タテイシユウキ')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- テスト用のサンプルルームを作成
INSERT INTO rooms (code, name, created_by, expires_at) VALUES
  ('1234', 'テストルーム', '65f84249-580c-462a-966e-d5ea425658c2', NOW() + INTERVAL '24 hours')
ON CONFLICT (code) DO NOTHING;

-- ルームメンバーに追加
INSERT INTO room_members (room_id, user_id)
SELECT r.id, '65f84249-580c-462a-966e-d5ea425658c2'
FROM rooms r
WHERE r.code = '1234'
ON CONFLICT (room_id, user_id) DO NOTHING;
