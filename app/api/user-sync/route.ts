import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"; // 管理用Supabaseクライアント

export async function POST(request: Request) {
    const supabaseAdmin = await getSupabaseAdmin();
    try {
        const body = await request.json();
        const { id, email, name, mode } = body;

        if (!id || !email || !name) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (mode === "insert_if_not_exists") {
            // すでに同じemailがあったら新規登録しない（エラーを返す）
            const { data: existingUserByEmail } = await supabaseAdmin
                .from("users")
                .select("id")
                .eq("email", email)
                .single();

            if (existingUserByEmail) {
                return NextResponse.json(
                    { error: "このメールアドレスは既に使われています" },
                    { status: 409 }
                );
            }

            // insert
            const { error: insertError } = await supabaseAdmin
                .from("users")
                .insert({
                    id,
                    email,
                    name,
                });

            if (insertError) {
                return NextResponse.json(
                    { error: insertError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ message: "ユーザー登録完了" });
        } else if (mode === "update_if_exists") {
            const { error: updateError } = await supabaseAdmin
                .from("users")
                .update({
                    last_active_at: new Date().toISOString(), // ここで今の日時をセット
                    // 必要ならnameなど他の項目は除外してOK
                })
                .eq("id", id);

            if (updateError) {
                return NextResponse.json(
                    { error: updateError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ message: "最終ログイン日時更新完了" });
        } else {
            return NextResponse.json(
                { error: "Invalid mode" },
                { status: 400 }
            );
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
