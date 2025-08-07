// pages/api/user-sync.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const supabaseAdmin = await getSupabaseAdmin();
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        // リクエストボディからユーザーデータ受け取り（IDなど）
        const { id, email, name } = req.body;

        if (!id || !email || !name) {
            return res.status(400).json({ error: "Missing user data" });
        }

        // upsert（挿入 or 更新）実行
        const { error } = await supabaseAdmin
            .from("users")
            .upsert(
                { id, email, name, updated_at: new Date().toISOString() },
                { onConflict: "id" }
            );

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: "User synced successfully" });
    } catch (error) {
        console.error("API error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
