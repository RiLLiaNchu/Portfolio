"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/ui/header";
import { RoomCreateForm } from "@/components/features/room-list/RoomCreateForm";
import { RoomListView } from "@/components/features/room-list/RoomListView";
import { fetchRooms } from "@/lib/api/rooms";
import { RoomWithAuthor } from "@/types/room";
import { RoomPasswordModal } from "@/components/features/room-list/RoomPasswordModal";
import { RoomSearchBar } from "@/components/features/room-list/RoomSearchBar";

export default function RoomList() {
    const [rooms, setRooms] = useState<RoomWithAuthor[]>([]);
    const [search, setSearch] = useState("");
    const [selectedRoom, setSelectedRoom] = useState<RoomWithAuthor | null>(
        null
    );
    const [passwordInput, setPasswordInput] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // rooms データを取得
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchRooms();
            setRooms(data);
            setLoading(false);
        };
        load();
    }, []);

    // 検索結果を useMemo で計算
    const filteredRooms = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return keyword
            ? rooms.filter(
                  (r) =>
                      r.name.toLowerCase().includes(keyword) ||
                      r.created_by_name.toLowerCase().includes(keyword)
              )
            : rooms;
    }, [search, rooms]);

    const handleRoomClick = (room: RoomWithAuthor) => {
        setSelectedRoom(room);
        setShowPasswordModal(true);
    };

    const handleCloseModal = () => {
        setPasswordInput("");
        setShowPasswordModal(false);
    };

    return (
        <>
            <Header title="ルーム一覧" backHref="/home" />
            <div className="max-w-lg mx-auto p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                    <RoomSearchBar search={search} onSearchChange={setSearch} />
                    <RoomCreateForm />
                </div>

                <RoomListView
                    rooms={filteredRooms}
                    onRoomClick={handleRoomClick}
                    loading={loading}
                />

                {/* 入室パスワードモーダル */}
                {selectedRoom && (
                    <RoomPasswordModal
                        room={selectedRoom}
                        isOpen={showPasswordModal}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </>
    );
}
