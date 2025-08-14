import { supabase } from "../supabase";
import type { Room, RoomWithAuthor } from "@/types/room";

// rooms テーブルから情報取得
export const fetchRooms = async (): Promise<RoomWithAuthor[]> => {
    const { data, error } = await supabase
        .from("rooms")
        .select(
            `
            id,
            name,
            created_at,
            created_by,
            users:created_by (
                name
            )
        `
        )
        .order("created_at", { ascending: false }); // 並び順も追加する

    if (error) {
        console.error("ルーム一覧取得に失敗:", error.message);
        return []; // エラー時は空配列を返す（アプリが落ちないように）
    }

    const roomsWithAuthor = data.map((room: any) => ({
        id: room.id,
        name: room.name,
        created_at: room.created_at,
        created_by: room.created_by,
        expires_at: room.expires_at,
        created_by_name: room.users?.name ?? "不明",
    }));
    return roomsWithAuthor;
};

// 共通: 現在ユーザーが他のルームに入っていたら退出して、指定ルームに参加する処理
export const joinRoom = async (roomId: string, password?: string) => {
    // 現在ログインしているユーザー取得
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) throw new Error("ログインしてください");

    // 他のルームに入っていたら退出
    const { data: currentRooms } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", user.id);

    if (currentRooms && currentRooms.length > 0) {
        await supabase.from("room_members").delete().eq("user_id", user.id);
    }

    // パスワードありならチェック
    if (password) {
        const { data: roomData, error: roomError } = await supabase
            .from("rooms")
            .select("id")
            .eq("id", roomId)
            .eq("password", password)
            .single();

        if (roomError || !roomData) throw new Error("パスワードが違います");
    }

    // 参加情報を登録
    await supabase.from("room_members").insert({
        room_id: roomId,
        user_id: user.id,
    });

    return user;
};
