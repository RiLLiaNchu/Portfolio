"use client";

import { Button } from "./button";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { Badge } from "./badge";
import { Input } from "./input";

type HeaderProps = {
    title: string;
    backHref?: string; // 戻るボタンリンク
    onMenuClick?: () => void; // ハンバーガークリック時
    status?: { text: string; variant?: "default" | "secondary" | "destructive" }; // ステータスバッジ
    showSearch?: boolean; // 検索バー表示
    onSearchChange?: (value: string) => void; // 検索入力イベント
};

const Header: React.FC<HeaderProps> = ({
    title,
    backHref,
    onMenuClick,
    status,
    showSearch = false,
    onSearchChange,
}: HeaderProps) => {
    return (
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col gap-2">
            {/* 上段 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {backHref && (
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={backHref} aria-label="戻る">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                    )}
                    <h1 className="text-lg font-bold">{title}</h1>
                    {status && (
                        <Badge variant={status.variant || "default"}>{status.text}</Badge>
                    )}
                </div>

                {onMenuClick && (
                    <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="メニュー">
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* 下段（検索バー） */}
            {showSearch && (
                <Input
                    type="text"
                    placeholder="検索..."
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="mt-1"
                />
            )}
        </header>
    );
}

export { Header };
