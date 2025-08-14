"use client";

import React from "react";

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
};

export const RoomSearchBar: React.FC<Props> = ({ search, onSearchChange }) => {
    return (
        <input
            type="text"
            placeholder="ルーム名または作成者名で検索"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-grow p-2 border rounded mr-4"
        />
    );
};
