"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

import MemberList from "./components/-MemberList";
import TableList from "./components/-TableList";
import CreateTableDialog from "./components/CreateTableDialog";
import { Header } from "@/components/ui/header";

interface Room {
    id: string;
    name: string;
    code?: string;
    created_at: string;
    expires_at: string;
    created_by: string;
}

interface RoomMember {
    id: string;
    user_id: string;
    users: {
        id: string;
        name: string;
        email: string;
    };
    joined_at: string;
}

export default function RoomPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [room, setRoom] = useState<Room | null>(null);
    const [members, setMembers] = useState<RoomMember[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const resolvedParams = use(params);

    const { authUser } = useAuth();
    const router = useRouter();
    const roomId = resolvedParams.id;

    useEffect(() => {
        if (!authUser) {
            router.push("/login");
            return;
        }

        loadRoomData(roomId);

        // リアルタイム更新
        const channel = supabase
            .channel(`room-${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "room_members",
                    filter: `room_id=eq.${roomId}`,
                },
                () => loadRoomData(roomId)
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tables",
                    filter: `room_id=eq.${roomId}`,
                },
                () => loadRoomData(roomId)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [authUser, roomId]);

    const loadRoomData = async (roomId: string) => {
        try {
            setLoading(true);
            setError("");

            // ルーム情報取得
            const { data: roomData, error: roomError } = await supabase
                .from("rooms")
                .select("*")
                .eq("id", roomId)
                .single();
            if (roomError) throw roomError;
            setRoom(roomData);

            // メンバー一覧取得
            const { data: membersData, error: membersError } = await supabase
                .from("room_members")
                .select("*, users(id, name, email)")
                .eq("room_id", roomId)
                .order("joined_at", { ascending: true });
            if (membersError) throw membersError;
            setMembers(membersData || []);

            // 卓一覧取得
            const { data: tablesData, error: tablesError } = await supabase
                .from("tables")
                .select("*")
                .eq("room_id", roomId)
                .order("created_at", { ascending: false });
            if (tablesError) throw tablesError;
            setTables(tablesData || []);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "ルーム情報の取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>読み込み中...</div>;
    if (error) return <div>エラー: {error}</div>;
    if (!room) return <div>ルームが見つかりません</div>;

    return (
        <div className="p-4 max-w-5xl mx-auto space-y-6">
            <Header />

            <div className="flex gap-6">
                {/* メンバー一覧 */}
                <div className="w-1/3">
                    <MemberList members={members} />
                </div>

                {/* 卓一覧 */}
                <div className="flex-1">
                    <TableList
                        tables={tables}
                        roomCode={room.code || ""}
                        onOpenCreateModal={() => setShowCreateModal(true)}
                    />
                </div>
            </div>

            {/* 卓作成モーダル */}
            <CreateTableDialog
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                roomId={room.id}
                roomCode={room.code || ""}
            />
        </div>
    );
}
