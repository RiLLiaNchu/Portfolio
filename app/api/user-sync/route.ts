// app/api/user-sync/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();

    const body = await req.json();
    const { id, email, name } = body;

    if (!id || !email || !name) {
      return NextResponse.json(
        { error: "Missing user data" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id,
          email,
          name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "User synced successfully" });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
