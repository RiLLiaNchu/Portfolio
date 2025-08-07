"use server";

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

let supabaseAdmin: SupabaseClient<Database, 'public', any> | null = null;

export async function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase admin environment variables");
    }

    supabaseAdmin = createClient<Database, 'public', any>(
      supabaseUrl,
      serviceRoleKey
    );
  }

  return supabaseAdmin;
}
