import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
    try {
        const { id, email, name } = await request.json();

        const supabaseAdmin = await getSupabaseAdmin();

        const { error } = await supabaseAdmin
            .from("users")
            .upsert({ id, email, name, is_admin: false }, { onConflict: "id" });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: "ok" });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
