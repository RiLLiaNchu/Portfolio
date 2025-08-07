"use server";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables");
}

// 「use server」ファイルで定数exportはNGなので関数にする
export async function getSupabaseAdmin() {
    return createClient<Database>(supabaseUrl, serviceRoleKey);
}
