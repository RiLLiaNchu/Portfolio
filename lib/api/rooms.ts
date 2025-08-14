import type { Room } from "@/types/room";
import { supabase } from "../supabase";

export type RoomWithAuthor = Omit<Room, "created_by_name"> & {
    created_by_name: string;
};

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

    console.log(data);
    if (error) {
        console.error("ルーム一覧取得に失敗:", error.message);
        return []; // エラー時は空配列を返す（アプリが落ちないように）
    }

    const roomsWithAuthor = data.map((room: any) => ({
        id: room.id,
        name: room.name,
        created_at: room.created_at,
        created_by: room.created_by,
        created_by_name: room.users?.name ?? "不明",
    }));
    return roomsWithAuthor;
};

export const createRoom = async (
    name: string,
    password: string
): Promise<void> => {
    console.log("APIでルーム作成:", name, password);
    // 実際には Supabase に挿入する処理など
};
