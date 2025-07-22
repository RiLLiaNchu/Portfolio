-- サンプルユーザーを作成（テスト用）
INSERT INTO users (id, email, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'test1@example.com', 'テストユーザー1'),
  ('550e8400-e29b-41d4-a716-446655440002', 'test2@example.com', 'テストユーザー2'),
  ('550e8400-e29b-41d4-a716-446655440003', 'test3@example.com', 'テストユーザー3'),
  ('550e8400-e29b-41d4-a716-446655440004', 'test4@example.com', 'テストユーザー4')
ON CONFLICT (email) DO NOTHING;

-- サンプルルームを作成
INSERT INTO rooms (id, code, name, created_by, expires_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '1234', 'テストルーム', '550e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '24 hours')
ON CONFLICT (code) DO NOTHING;

-- サンプルルームメンバーを追加
INSERT INTO room_members (room_id, user_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (room_id, user_id) DO NOTHING;
