// pages/api/user-sync.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

// 環境変数からSupabaseのURLとサービスロールキーを読み込み
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // リクエストボディからユーザーデータ受け取り（IDなど）
    const { id, email, name } = req.body;

    if (!id || !email || !name) {
      return res.status(400).json({ error: 'Missing user data' });
    }

    // upsert（挿入 or 更新）実行
    const { error } = await supabaseAdmin
      .from('users')
      .upsert({ id, email, name, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'User synced successfully' });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
