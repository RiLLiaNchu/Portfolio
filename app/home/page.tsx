"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, BarChart3, Users, Plus, LogOut } from "lucide-react";
import { Header } from "@/components/ui/header";

export default function HomePage() {
    const { authUser, loading, signOut } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalGames: 12,
        averageRank: 2.3,
        winRate: 28.5,
        dealInRate: 15.2,
    });

    useEffect(() => {
        if (!loading && !authUser) {
            router.push("/");
        }
    }, [authUser, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!authUser) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <Header
                icon={<div className="text-2xl">🀄</div>}
                title={
                    <div>
                        <div>麻雀戦績管理</div>
                        <p className="text-sm text-gray-600">
                            おかえりなさい、
                            {authUser.user_metadata?.name || "ユーザー"}さん
                        </p>
                    </div>
                }
            />

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* 統計サマリー */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-green-600" />
                            あなたの戦績
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {stats.totalGames}
                                </div>
                                <div className="text-sm text-gray-600">
                                    総試合数
                                </div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {stats.averageRank}
                                </div>
                                <div className="text-sm text-gray-600">
                                    平均順位
                                </div>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {stats.winRate}%
                                </div>
                                <div className="text-sm text-gray-600">
                                    和了率
                                </div>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">
                                    {stats.dealInRate}%
                                </div>
                                <div className="text-sm text-gray-600">
                                    放銃率
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 最近の戦績 */}
                <Card>
                    <CardHeader>
                        <CardTitle>最近の戦績</CardTitle>
                        <CardDescription>直近5試合の結果</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                {
                                    date: "2024/01/15",
                                    rank: 1,
                                    score: "+32000",
                                    room: "友人戦",
                                },
                                {
                                    date: "2024/01/14",
                                    rank: 3,
                                    score: "-8000",
                                    room: "友人戦",
                                },
                                {
                                    date: "2024/01/13",
                                    rank: 2,
                                    score: "+15000",
                                    room: "オンライン",
                                },
                                {
                                    date: "2024/01/12",
                                    rank: 4,
                                    score: "-25000",
                                    room: "友人戦",
                                },
                                {
                                    date: "2024/01/11",
                                    rank: 2,
                                    score: "+12000",
                                    room: "オンライン",
                                },
                            ].map((game, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                                game.rank === 1
                                                    ? "bg-yellow-500"
                                                    : game.rank === 2
                                                    ? "bg-gray-400"
                                                    : game.rank === 3
                                                    ? "bg-orange-500"
                                                    : "bg-red-500"
                                            }`}
                                        >
                                            {game.rank}
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {game.room}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {game.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={`font-bold ${
                                            game.score.startsWith("+")
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {game.score}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* アクションボタン */}
                <div className="space-y-3">
                    <Button
                        asChild
                        className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
                    >
                        <Link href="/room-list">
                            <Plus className="h-5 w-5 mr-2" />
                            ルームに参加する
                        </Link>
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            asChild
                            variant="outline"
                            className="py-6 bg-transparent"
                        >
                            <Link href="/mydata">
                                <BarChart3 className="h-5 w-5 mr-2" />
                                マイデータ
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="py-6 bg-transparent"
                        >
                            <Link href="/settings">
                                <Settings className="h-5 w-5 mr-2" />
                                設定
                            </Link>
                        </Button>
                    </div>

                    {authUser.user_metadata?.is_admin && (
                        <Button
                            asChild
                            variant="outline"
                            className="w-full py-6 bg-transparent"
                        >
                            <Link href="/admin">
                                <Users className="h-5 w-5 mr-2" />
                                管理者ページ
                            </Link>
                        </Button>
                    )}

                    {process.env.NODE_ENV === "development" && (
                        <Button
                            asChild
                            variant="outline"
                            className="w-full py-6 bg-transparent border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                            <Link href="/debug">🔧 デバッグページ</Link>
                        </Button>
                    )}
                </div>

                {/* 最後に入った部屋 */}
                <Card>
                    <CardHeader>
                        <CardTitle>最後に入った部屋</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                                <div className="font-medium">友人戦ルーム</div>
                                <div className="text-sm text-gray-600">
                                    ルームコード: 1234
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                asChild
                            >
                                <Link href="/room/1234">再入室</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
