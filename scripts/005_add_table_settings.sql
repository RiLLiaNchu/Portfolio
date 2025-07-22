-- tablesテーブルにsettings列を追加
ALTER TABLE tables ADD COLUMN IF NOT EXISTS settings JSONB;

-- 既存のテーブルにコメントを追加
COMMENT ON COLUMN tables.settings IS '卓の設定情報（JSON形式）: ゲーム種別、順位点、持ち点、返し点、スコア計算方法など';

-- インデックスを追加（設定での検索を高速化）
CREATE INDEX IF NOT EXISTS idx_tables_settings ON tables USING GIN (settings);
