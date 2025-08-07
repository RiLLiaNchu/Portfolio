"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogoutButton } from "../features/LogoutButton";

/**
 * Header component
 * - backHref があれば戻るボタンを出す（ページ固有）
 * - icon を渡せばタイトル左に表示（ホームで使う）
 * - ログアウトボタンは固定表示
 * - モバイル対応済み
 */

type HeaderProps = {
    title?: React.ReactNode;
    backHref?: string; // 戻るボタンリンク
    icon?: React.ReactNode;
    status?: {
        text: string;
        variant?: "default" | "secondary" | "destructive";
    }; // ステータスバッジ
};

const Header: React.FC<HeaderProps> = ({ title, backHref, icon, status }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleToggleMenu = () => setIsMenuOpen((v) => !v);
    const handleCloseMenu = () => setIsMenuOpen(false);

    // 外部クリックでメニューを閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                {/* 左エリア */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {backHref && (
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            aria-label="戻る"
                        >
                            <Link href={backHref}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                    )}

                    {/* アイコン + タイトル */}
                    <div className="flex items-center gap-2">
                        {icon && (
                            <div className="h-7 w-7 flex items-center justify-center">
                                {icon}
                            </div>
                        )}

                        {title && (
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-bold">
                                    {title}
                                </h1>
                                {status && (
                                    <Badge
                                        variant={status.variant ?? "default"}
                                    >
                                        {status.text}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 右エリア */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleMenu}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        aria-label="メニューを開く"
                    >
                        <MenuIcon className="h-5 w-5" />
                    </Button>

                    {/* simple menu */}
                    {isMenuOpen && (
                        <div
                            ref={menuRef}
                            role="menu"
                            aria-label="ヘッダーメニュー"
                            className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50"
                        >
                            <div className="flex flex-col py-1">
                                {/* メニュー項目 */}
                                <LogoutButton onAfterLogout={handleCloseMenu} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export { Header };
