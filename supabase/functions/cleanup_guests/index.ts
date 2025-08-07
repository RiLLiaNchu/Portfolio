// supabase functions invoke cleanup_guests
// 1日以上ログインしてないゲストユーザーの消去
// 定期的に実行 頭に npx を付けないとダメかも
// 定期実行させるには？
// Supabaseは今のところネイティブcron機能は無いから、外部で定期的にこの関数を呼ぶ方法を使う。
// 例えば、
// GitHub Actionsのcronで呼ぶ
// VercelのCron Jobs
// AWS Lambda + EventBridge など

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // ここはサービスロールキーを使うよ

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
        .from("users")
        .delete()
        .eq("is_guest", true)
        .lt(
            "last_active_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

    if (error) {
        return new Response(`Error deleting old guests: ${error.message}`, {
            status: 500,
        });
    }

    return new Response("Old guest users deleted successfully");
});