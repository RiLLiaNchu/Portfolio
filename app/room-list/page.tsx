"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Header } from "@/components/ui/header";

type Room = {
    id: string;
    name: string;
    created_by_name: string;
    created_at: string;
};

export default function RoomList() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [search, setSearch] = useState("");
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [passwordInput, setPasswordInput] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // ルーム作成モーダル用ステート
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomPassword, setNewRoomPassword] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // モックのfetchRooms。実際はSupabaseなどのAPIに置き換えてね
    const fetchRooms = async () => {
        const data: Room[] = [
            {
                id: "1",
                name: "初心者ルーム",
                created_by_name: "太郎",
                created_at: "2025-08-07T12:34:56Z",
            },
            {
                id: "2",
                name: "上級者ルーム",
                created_by_name: "花子",
                created_at: "2025-08-06T10:00:00Z",
            },
        ];
        setRooms(data);
    };

    useEffect(() => {
        fetchRooms();
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

    const openPasswordModal = (room: Room) => {
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

    // ルーム作成処理（API連携に差し替えてね）
    const handleCreateRoom = async () => {
        setCreateError("");
        if (!newRoomName.trim()) {
            setCreateError("ルーム名は必須です");
            return;
        }
        if (!/^\d{4}$/.test(newRoomPassword)) {
            setCreateError("パスワードは4桁の数字で入力してください");
            return;
        }
        setCreating(true);
        try {
            // ここでAPI呼び出し。成功したらfetchRoomsで更新
            console.log(
                `新規ルーム作成: 名前=${newRoomName}, パスワード=${newRoomPassword}`
            );

            // --- API成功した想定 ---
            await new Promise((r) => setTimeout(r, 1000)); // 疑似遅延
            // 実際はAPIで返ってきた最新ルーム一覧を再取得
            await fetchRooms();

            setShowCreateModal(false);
            setNewRoomName("");
            setNewRoomPassword("");
        } catch (e) {
            setCreateError("ルーム作成に失敗しました");
        } finally {
            setCreating(false);
        }
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
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => setShowCreateModal(true)}
                    >
                        ルーム作成
                    </button>
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

                {/* ルーム作成モーダル */}
                {showCreateModal && (
                    <div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <div
                            className="bg-white p-6 rounded shadow-lg w-80"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl mb-4 font-bold">
                                ルーム作成
                            </h2>
                            <input
                                type="text"
                                placeholder="ルーム名"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                className="w-full p-2 mb-4 border rounded"
                                required
                            />
                            <input
                                type="password"
                                maxLength={4}
                                placeholder="4桁の数字パスワード"
                                value={newRoomPassword}
                                onChange={(e) => {
                                    if (/^\d{0,4}$/.test(e.target.value)) {
                                        setNewRoomPassword(e.target.value);
                                    }
                                }}
                                className="w-full p-2 mb-4 border rounded"
                                required
                            />
                            {createError && (
                                <div className="text-red-600 text-sm mb-2">
                                    {createError}
                                </div>
                            )}
                            <button
                                className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
                                disabled={
                                    !newRoomName.trim() ||
                                    newRoomPassword.length !== 4 ||
                                    creating
                                }
                                onClick={handleCreateRoom}
                            >
                                {creating ? "作成中..." : "ルーム作成"}
                            </button>
                            <button
                                className="mt-2 w-full text-center text-gray-600 underline"
                                onClick={() => setShowCreateModal(false)}
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
