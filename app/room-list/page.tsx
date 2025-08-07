// ルームリスト
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";

/**
 * シンプルなモーダル
 */
// function Modal({ open, onClose, title, children }: any) {}

export default function JoinRoomPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                title="ルーム一覧"
                backHref="/home"
                onMenuClick={() => console.log("メニューを開く")}
                status={{ text: "オンライン", variant: "default" }}
                showSearch
                onSearchChange={(val) => console.log("検索:", val)}
            />
        </div>
    );
}
