"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu as MenuIcon } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

/**
 * Header component
 * - backHref があれば戻るボタンを出す（ページ固有）
 * - icon を渡せばタイトル左に表示（ホームで使う）
 * - menuItems でハンバーガーメニューの中身を指定できる
 * - onLogout が渡っていればログアウト項目を自動追加
 */

type MenuItem = {
    label: string;
    onClick?: () => void;
    href?: string; // リンクとして使いたい場合
};

type HeaderProps = {
    title?: React.ReactNode;
    backHref?: string; // 戻るボタンリンク
    icon?: React.ReactNode;
    status?: {
        text: string;
        variant?: "default" | "secondary" | "destructive";
    }; // ステータスバッジ
    menuItems?: MenuItem[];
    onLogout?: () => void; // メニュー内に "ログアウト" の追加
};

const Header: React.FC<HeaderProps> = ({
    title,
    backHref,
    icon,
    status,
    menuItems = [],
    onLogout,
}: HeaderProps) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleToggleMenu = () => setMenuOpen((v) => !v);
    const handleCloseMenu = () => setMenuOpen(false);

    const hasMenu = menuItems.length > 0 || !!onLogout;

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                {/* left area: back button / icon + title */}
                <div className="flex items-center gap-3">
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
                                <h1 className="text-lg font-bold">{title}</h1>
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

                {/* right area: menu */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleMenu}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label="メニューを開く"
                    >
                        <MenuIcon className="h-5 w-5" />
                    </Button>

                    {/* simple menu */}
                    {menuOpen && (
                        <div
                            role="menu"
                            aria-label="ヘッダーメニュー"
                            className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50"
                        >
                            <div className="flex flex-col py-1">
                                {menuItems.map((it, idx) => {
                                    const commonProps = {
                                        key: idx,
                                        className: "px-4 py-2 text-sm hover:bg-gray-100",
                                        role: "menuitem",
                                        onClick: () => {
                                            handleCloseMenu();
                                            it.onClick?.();
                                        },
                                    };

                                    return it.href ? (
                                        <Link href={it.href} {...commonProps}>
                                            {it.label}
                                        </Link>
                                    ) : (
                                        <button {...commonProps} className="text-left">
                                            {it.label}
                                        </button>
                                    );
                                })}

                                {onLogout && (
                                    <>
                                        <div className="border-t my-1" />
                                        <button
                                            onClick={() => {
                                                handleCloseMenu();
                                                onLogout();
                                            }}
                                            className="px-4 py-2 text-sm text-red-600 hover: bg-red-50 text-left"
                                            role="menuitem"
                                        >
                                            ログアウト
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export { Header };
