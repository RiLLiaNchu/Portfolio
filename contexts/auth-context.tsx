"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Profile = {
    id: string;
    name?: string | null;
    email?: string | null;
    is_admin?: boolean | null;
    updated_at?: string | null;
};

interface AuthContextType {
    authUser: User | null; // supabase auth のユーザー情報（トークン等）
    profile: Profile | null; // DB の users テーブルのプロフィール（is_admin など含む）
    loading: boolean;
    isGuest: boolean;
    isAdmin: boolean; // 簡易フラグ（profile?.is_admin === true）
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signInAsGuest: (name: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    const isAdmin = profile?.is_admin === true;

    // DB の users テーブルから profile を取得する (id で)
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("id, name, email, is_admin, updated_at")
                .eq("id", userId)
                .single();

            if (error) {
                // 404 相当やテーブル不存在などは無視して null を返す
                console.warn("profile fetch warning:", error.message);
                setProfile(null);
                return null;
            }

            setProfile(data as Profile);
            return data as Profile;
        } catch (err: any) {
            console.error("fetchProfile error:", err);
            setProfile(null);
            return null;
        }
    };

    // authUser を DB の users テーブルに同期する（上書きで is_admin を消さないように注意）
    // modeを追加: "insert_if_not_exists" または "update_if_exists"
    const syncUserToDatabase = async (
        authUser: User,
        mode:
            | "insert_if_not_exists"
            | "update_if_exists" = "insert_if_not_exists"
    ) => {
        try {
            const userData = {
                id: authUser.id,
                email: authUser.email ?? null,
                name:
                    (authUser as any)?.user_metadata?.name ??
                    authUser.email?.split("@")[0] ??
                    "Unknown User",
                mode, // ← APIにモードも渡す
            };

            console.log("ユーザー同期データ:", userData);

            const response = await fetch("/api/user-sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            let result: any = null;
            try {
                result = await response.json(); // JSONを読み取り
            } catch (err) {
                console.error(
                    "❌ Failed to parse JSON from user-sync API:",
                    err
                );
                const text = await response.text();
                console.error("🔎 Raw response text:", text);
                return;
            }

            if (!response.ok) {
                // エラーは返して、呼び出し元で表示制御
                return { error: result?.error || "Unknown error" };
            }

            console.log("✅ user-sync success:", result.message);
        } catch (err: any) {
            console.error("syncUserToDatabase unexpected error:", {
                message: err?.message,
                stack: err?.stack,
                raw: err,
            });
        }
    };

    // ゲストユーザー向けの DB 同期（is_admin は false にする）
    const syncGuestToDatabase = async (guestUser: User) => {
        const supabaseAdmin = await getSupabaseAdmin();
        try {
            const { error: tableError } = await supabaseAdmin
                .from("users")
                .select("id")
                .limit(1);
            if (tableError) {
                console.warn(
                    "users テーブルが見つかりません。ゲスト同期をスキップします:",
                    tableError.message
                );
                return;
            }

            const userData = {
                id: guestUser.id,
                email: guestUser.email ?? null,
                name: guestUser.user_metadata?.name ?? "ゲストユーザー",
                is_admin: false,
            };

            const { error } = await supabaseAdmin
                .from("users")
                .upsert(userData, {
                    onConflict: "id",
                });

            if (error) {
                console.error("syncGuestToDatabase error:", error);
            } else {
                await fetchProfile(guestUser.id);
            }
        } catch (err: unknown) {
            console.error("syncUserToDatabase unexpected error:", {
                raw: err,
                type: typeof err,
                isErrorInstance: err instanceof Error,
                message: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : "No stack",
            });
        }
    };

    // 全体初期化 & 認証状態リスナー設定
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            setLoading(true);
            try {
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error("getSession error:", sessionError);
                    setAuthUser(null);
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    if (!mounted) return;
                    setAuthUser(session.user);
                    await syncUserToDatabase(session.user, "update_if_exists");
                } else {
                    setAuthUser(null);
                    setProfile(null);
                }
            } catch (err) {
                console.error("init auth error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        init();

        const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setLoading(true);
                try {
                    if (session?.user) {
                        setAuthUser(session.user);
                        await syncUserToDatabase(
                            session.user,
                            "update_if_exists"
                        );
                    } else {
                        setAuthUser(null);
                        setProfile(null);
                    }
                } catch (err) {
                    console.error("onAuthStateChange handler error:", err);
                } finally {
                    setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            listener.subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 公開 API: プロファイル再取得
    const refreshProfile = async () => {
        if (!authUser) return;
        await fetchProfile(authUser.id);
    };

    // サインアップ
    const signUp = async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) {
            if (
                error.status === 400 &&
                error.message.includes("User already registered")
            ) {
                throw new Error("このメールアドレスは既に使われています");
            }

            throw new Error("登録中にエラーが発生しました");
        }

        if (data.user) {
            const syncResult = await syncUserToDatabase(
                data.user,
                "insert_if_not_exists"
            );

            if (syncResult?.error) {
                // ここで表示用の state にエラーをセットする or alert する
                throw new Error(syncResult.error); // ここも必要なら UI 側に投げる
            }
        }
    };

    // サインイン
    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        if (data.user) {
            try {
                await syncUserToDatabase(data.user, "update_if_exists");
            } catch (syncError) {
                // ここでエラーをログに出すけど、throwしないからログインは止まらないよ
                console.error("syncUserToDatabaseでエラー発生:", syncError);
            }
        }
    };

    // ゲストサインイン（クライアント側で擬似ユーザーを作る）
    const signInAsGuest = async (name: string) => {
        const guestId = crypto.randomUUID();
        const guestUser = {
            id: guestId,
            email: `${guestId}@guest.local`,
            user_metadata: { name, is_guest: true },
        } as unknown as User;

        setAuthUser(guestUser);
        setIsGuest(true);

        // サーバーのAPIを呼び出してDB同期をお願いする
        const res = await fetch("/api/guest-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: guestUser.id,
                email: guestUser.email,
                name,
            }),
        });

        if (!res.ok) {
            console.error("ゲスト同期APIエラー", await res.text());
        }
    };

    // サインアウト
    const signOut = async () => {
        if (isGuest) {
            setAuthUser(null);
            setProfile(null);
            setIsGuest(false);
            return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setAuthUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                authUser,
                profile,
                loading,
                isGuest,
                isAdmin,
                signIn,
                signUp,
                signInAsGuest,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
