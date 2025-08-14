"use client";

import React from "react";
import dayjs from "dayjs";
import { RoomWithAuthor } from "@/types/room";

type Props = {
    rooms: RoomWithAuthor[];
    onRoomClick: (room: RoomWithAuthor) => void;
    loading?: boolean;
};

export const RoomListView: React.FC<Props> = ({
    rooms,
    onRoomClick,
    loading,
}) => {
    if (loading) {
        return <p className="text-center text-gray-500 py-4">読み込み中...</p>;
    }

    if (rooms.length === 0) {
        return (
            <p className="text-center text-gray-500 py-4">
                ルームが見つかりません
            </p>
        );
    }

    return (
        <ul>
            {rooms.map((room) => (
                <li
                    key={room.id}
                    className="p-3 mb-2 border rounded cursor-pointer hover:bg-green-50 focus:outline-none focus:ring focus:ring-green-200"
                    onClick={() => onRoomClick(room)}
                >
                    <div className="font-bold text-lg sm:text-lg">
                        {room.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                        作成者: {room.created_by_name}
                    </div>
                    <div className="text-xs text-gray-400">
                        作成日:{" "}
                        {dayjs(room.created_at).format("YYYY/MM/DD HH:mm")}
                    </div>
                </li>
            ))}
        </ul>
    );
};
