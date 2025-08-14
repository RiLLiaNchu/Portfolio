"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Header } from "@/components/ui/header";
import { RoomCreateForm } from "@/components/features/room-list/RoomCreateForm";
import { fetchRooms, RoomWithAuthor } from "@/lib/api/rooms";
import type { Room } from "@/types/room";

export default function RoomList() {
    const [rooms, setRooms] = useState<RoomWithAuthor[]>([]);
    const [search, setSearch] = useState("");
    const [filteredRooms, setFilteredRooms] = useState<RoomWithAuthor[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<RoomWithAuthor | null>(
        null
    );
    const [passwordInput, setPasswordInput] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // ルーム作成モーダル用ステート
    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomPassword, setNewRoomPassword] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => {
        const load = async () => {
            const data = await fetchRooms();
            setRooms(data);
        };
        load();
    }, []);

    useEffect(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) {
            setFilteredRooms(rooms);
            return;
        }
        setFilteredRooms(
            rooms.filter(
                (r) =>
                    r.name.toLowerCase().includes(keyword) ||
                    r.created_by_name.toLowerCase().includes(keyword)
            )
        );
    }, [search, rooms]);

    const openPasswordModal = (room: RoomWithAuthor) => {
        setSelectedRoom(room);
        setPasswordInput("");
        setShowPasswordModal(true);
    };

    const handleJoin = () => {
        if (!selectedRoom) return;
        console.log(
            `ルームID: ${selectedRoom.id}, パスワード: ${passwordInput} で入室処理`
        );
        setShowPasswordModal(false);
    };

    return (
        <>
            <Header title="ルーム一覧" backHref="/home" />
            <div className="max-w-lg mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <input
                        type="text"
                        placeholder="ルーム名または作成者名で検索"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-grow p-2 border rounded mr-4"
                    />
                    <RoomCreateForm />
                </div>

                <ul>
                    {filteredRooms.map((room) => (
                        <li
                            key={room.id}
                            className="p-3 mb-2 border rounded cursor-pointer hover:bg-green-50"
                            onClick={() => openPasswordModal(room)}
                        >
                            <div className="font-bold text-lg">{room.name}</div>
                            <div className="text-sm text-gray-600">
                                作成者: {room.created_by_name}
                            </div>
                            <div className="text-xs text-gray-400">
                                作成日:{" "}
                                {dayjs(room.created_at).format(
                                    "YYYY/MM/DD HH:mm"
                                )}
                            </div>
                        </li>
                    ))}
                </ul>

                {/* 入室パスワードモーダル */}
                {showPasswordModal && selectedRoom && (
                    <div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                        onClick={() => setShowPasswordModal(false)}
                    >
                        <div
                            className="bg-white p-6 rounded shadow-lg w-80"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl mb-4 font-bold">
                                {selectedRoom.name} に入室
                            </h2>
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="4桁のパスワード"
                                value={passwordInput}
                                onChange={(e) => {
                                    if (/^\d{0,4}$/.test(e.target.value)) {
                                        setPasswordInput(e.target.value);
                                    }
                                }}
                                className="w-full p-2 mb-4 border rounded"
                            />
                            <button
                                className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
                                disabled={passwordInput.length !== 4}
                                onClick={handleJoin}
                            >
                                入室する
                            </button>
                            <button
                                className="mt-2 w-full text-center text-gray-600 underline"
                                onClick={() => setShowPasswordModal(false)}
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
