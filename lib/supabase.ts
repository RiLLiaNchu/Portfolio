import { createClient } from "@supabase/supabase-js";

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    created_at: string;
                    is_admin: boolean;
                };
                Insert: {
                    id?: string;
                    email: string;
                    name: string;
                    created_at?: string;
                    is_admin?: boolean;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    created_at?: string;
                    is_admin?: boolean;
                };
            };
            rooms: {
                Row: {
                    id: string;
                    code: string;
                    name: string;
                    created_at: string;
                    expires_at: string;
                };
                Insert: {
                    id?: string;
                    code: string;
                    name: string;
                    created_at?: string;
                    expires_at: string;
                };
                Update: {
                    id?: string;
                    code?: string;
                    name?: string;
                    created_at?: string;
                    expires_at?: string;
                };
            };
            games: {
                Row: {
                    id: string;
                    room_id: string;
                    player1_id: string;
                    player2_id: string;
                    player3_id: string;
                    player4_id: string;
                    scores: number[];
                    round_number: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    room_id: string;
                    player1_id: string;
                    player2_id: string;
                    player3_id: string;
                    player4_id: string;
                    scores: number[];
                    round_number: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    room_id?: string;
                    player1_id?: string;
                    player2_id?: string;
                    player3_id?: string;
                    player4_id?: string;
                    scores?: number[];
                    round_number?: number;
                    created_at?: string;
                };
            };
        };
    };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
