// ルームリスト
"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/ui/header";
import { JoinRoomForm } from "@/components/features/room-list/JoinRoomForm";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

/**
 * シンプルなモーダル
 */
function Modal({ open, onClose, title, children }: any) {}

export default function RoomListPage() {
    const [roomCode, setRoomCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [rooms, setRooms] = useState<any[]>([]);
    const { authUser, isGuest } = useAuth();
    const router = useRouter();

    // ルーム作成モーダル状態
    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createCode, setCreateCode] = useState("");
    const [createPassword, setCreatePassword] = useState("");

    useEffect(() => {
        if (!authUser) {
            router.push("/login");
            return;
        }
        loadRoomList();
    }, [authUser]);

    const loadRoomList = async () => {
        try {
            const { data, error } = await supabase
                .from("rooms")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) {
                console.warn("rooms list fetch error:", error);
                setRooms([]);
                return;
            }
            setRooms(data || []);
        } catch (err) {
            console.error("rooms list error:", err);
            setRooms([]);
        }
    };

    // ルーム参加（一覧クリック）
    const handleJoinRoomByCode = async (
        code: string,
        passwordFromRoom?: string
    ) => {
        if (!authUser) {
            setError("ログインが必要です");
            return;
        }
        setLoading(true);
        setError("");

        console.log("Trying to join room with code:", code);
        try {
            // まずユーザーが DB にいることを保証
            await ensureUserInDatabase();

            // ルームを取得
            const { data: room, error: roomError } = await supabase
                .from("rooms")
                .select("*")
                .eq("code", code)
                .maybeSingle();

            if (roomError) {
                throw new Error(roomError.message || "ルーム取得に失敗しました");
            }
            if (!room) {
                throw new Error("指定されたコードのルームが見つかりません")
            }

            // パスワードチェック（簡易）
            if (room.password && room.password !== "") {
                const provided = window.prompt(
                    "このルームはパスワードが必要です。パスワードを入力してください"
                );
                if (provided === null) {
                    setError("参加キャンセル");
                    return;
                }
                if (provided !== room.password) {
                    throw new Error("パスワードが違います");
                }
            }

            // メンバーに追加
            const { error: memberError } = await supabase
                .from("room_members")
                .upsert(
                    { room_id: room.id, user_id: authUser.id },
                    { onConflict: "room_id,user_id" }
                );

            if (memberError) throw memberError;

            router.push(`/room/${code}`);
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "不明なエラーが発生しました";
            console.error("join error:", {
                error: err,
                message: errorMessage,
            });
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // フォームからコード入力して参加
    const handleJoinByInput = async (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length !== 4) {
            setError("4桁のルームコードを入力してください");
            return;
        }
        await handleJoinRoomByCode(roomCode);
    };

    // ルーム作成（モーダル）
    const handleCreateRoom = async () => {
        if (!authUser) {
            setError("ログインが必要です");
            return;
        }
        if (!createCode || createCode.length !== 4) {
            setError("4桁のコードを生成してください");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await ensureUserInDatabase();

            const payload = {
                code: createCode,
                name: createName || `ルーム ${createCode}`,
                created_by: authUser.id,
                expires_at: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
                // 注意: パスワードはプレーンで保存している（開発用）
                password: createPassword || null,
            };

            console.log("create payload:", payload);

            const { data: newRoom, error: createError } = await supabase
                .from("rooms")
                .insert(payload)
                .select()
                .single();

            if (createError) {
                console.error("create room error:", createError);
                throw createError;
            }

            // 作成者を room_members にも追加
            await supabase
                .from("room_members")
                .upsert(
                    { room_id: newRoom.id, user_id: authUser.id },
                    { onConflict: "room_id,user_id" }
                );

            setCreateOpen(false);
            // 再読み込みしてリストに反映
            await loadRoomList();

            router.push(`/room/${createCode}`);
        } catch (err: any) {
            console.error("create error:", err);
            setError(err.message || "ルーム作成に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    // ユーザーを users に sync（既存ロジックを流用）
    const ensureUserInDatabase = async () => {
        if (!authUser) return false;
        try {
            const { data: existingUser, error: checkError } = await supabase
                .from("users")
                .select("id")
                .eq("id", authUser.id)
                .single();

            if (checkError) {
                // 存在しないなら insert
                await supabase.from("users").insert({
                    id: authUser.id,
                    email: authUser.email ?? null,
                    name:
                        authUser.user_metadata?.name ??
                        authUser.email?.split("@")[0] ??
                        null,
                });
            }
            return true;
        } catch (err) {
            console.error("ensureUserInDatabase error:", err);
            return true;
        }
    };

    if (!authUser) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="ルーム一覧" backHref="/home" />
            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* 参加フォーム */}
                <JoinRoomForm
                    roomCode={roomCode}
                    setRoomCode={setRoomCode}
                    onJoin={handleJoinByInput}
                    loading={loading}
                    error={error}
                    onOpenCreate={() => setCreateOpen(true)}
                />
            </div>
        </div>
    );
}
