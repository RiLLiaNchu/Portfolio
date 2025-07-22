"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerCard } from "@/components/features/tablepage/PlayerCard";
import { EmptyPlayerCard } from "@/components/features/tablepage/EmptyPlayerCard";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { statSync } from "fs";

type Table = {
    id: string;
    room_id: string;
    name: string;
    status: string;
    created_at: string;
};

type TablePlayer = {
    id: string;
    user_id: string;
    position: string;
    seat_order: number;
    current_score: number;
    users: {
        id: string;
        name: string;
        email: string;
    };
};

type Game = {
    id: string;
    round_name: string;
    round_number: number;
    winner_id: string | null;
    loser_id: string | null;
    han: number | null;
    fu: number | null;
    score: number | null;
    is_draw: boolean;
    created_at: string;
};

type GameStats = {
    user_id: string;
    is_dealer: boolean;
    win_count: number;
    total_win_points: number;
    deal_in_count: number;
    total_deal_in_points: number;
    riichi_count: number;
    call_count: number;
};

export default function TablePage(props: {
    params: Promise<{ code: string; tableId: string }>;
}) {
    const { code, tableId } = use(props.params);
    const [table, setTable] = useState<Table | null>(null);
    const [players, setPlayers] = useState<TablePlayer[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [joinLoading, setJoinLoading] = useState(false);

    const eastPlayer = players.find((p) => p.position === "東");
    const southPlayer = players.find((p) => p.position === "南");
    const westPlayer = players.find((p) => p.position === "西");
    const northPlayer = players.find((p) => p.position === "北");

    const isPlayerInTable = players.some((p) => p.user_id === user?.id);
    const canStart = players.length >= 1 && isPlayerInTable

    // 戦績入力モーダル関連
    const [gameStats, setGameStats] = useState<GameStats[]>([]);

    const { user, isGuest } = useAuth();

    const loadTableData = async () => {
        try {
            console.log("卓データ読み込み開始:", tableId);

            // 卓情報を取得.
            const { data: tableData, error: tableError } = await supabase
                .from("tables")
                .select("*")
                .eq("id", tableId)
                .single();

            console.log("卓取得結果:", { tableData, tableError });

            if (tableError) {
                if (tableError.code === "PGRST116") {
                    throw new Error("指定された卓は存在しません");
                }
                throw tableError;
            }

            setTable(tableData);

            // プレイヤー情報を取得
            const { data: playersData, error: playersError } = await supabase
                .from("table_players")
                .select("*")
                .eq("table_id", tableId)
                .order("seat_order", { ascending: true });

            console.log("プレイヤー取得結果:", { playersData, playersError });

            if (playersError && playersError.code !== "42P01") {
                throw playersError;
            }

            // 各プレイヤーのユーザー情報を個別に取得.
            const playersWithUsers = await Promise.all(
                (playersData || []).map(async (player) => {
                    const { data: userData, error: userError } = await supabase
                        .from("users")
                        .select("id, name, email")
                        .eq("id", player.user_id)
                        .single();

                    if (userError) {
                        console.error("ユーザー情報取得エラー:", userError);
                        return {
                            ...player,
                            users: {
                                id: player.user_id,
                                name: "Unknown User",
                                email: "unknown@example.com",
                            },
                        };
                    }

                    return {
                        ...player,
                        users: userData,
                    };
                })
            );

            setPlayers(playersWithUsers);

            // 統計データの初期化（プレイヤーが読み込まれた後）.
            if (playersWithUsers.length > 0) {
                const initialStats = playersWithUsers.map((player) => ({
                    user_id: player.user_id,
                    is_dealer: player.position === "東",
                    win_count: Math.floor(Math.random() * 3), // テスト用ランダムデータ
                    total_win_points: Math.floor(Math.random() * 20000),
                    deal_in_count: Math.floor(Math.random() * 2),
                    total_deal_in_points: Math.floor(Math.random() * 10000),
                    riichi_count: Math.floor(Math.random() * 4),
                    call_count: Math.floor(Math.random() * 3),
                }));
                setGameStats(initialStats);
            }

            // ゲーム履歴を取得
            const { data: gamesData, error: gamesError } = await supabase
                .from("games")
                .select("*")
                .eq("table_id", tableId)
                .order("created_at", { ascending: false })
                .limit(10);

            console.log("ゲーム取得結果:", { gamesData, gamesError });

            if (gamesError && gamesError.code !== "42P01") {
                throw gamesError;
            }
            setGames(gamesData || []);
        } catch (error: any) {
            console.error("卓データ読み込みエラー:", error);
            setError(error.message || "卓情報の取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const joinTable = async () => {
        if (!user || !table) return;

        setJoinLoading(true);
        try {
            // ゲストユーザーの場合、DBに存在することを確認
            if (isGuest || user.email?.endsWith("@guest.local")) {
                const { data: existingUser, error: checkError } = await supabase
                    .from("users")
                    .select("id")
                    .eq("id", user.id)
                    .single();
                if (checkError && checkError.code === "PGRST116") {
                    // ユーザーが存在しない場合は追加
                    console.log("ゲストユーザーをDBに追加中...");
                    const { error: insertError } = await supabase
                        .from("users")
                        .insert({
                            id: user.id,
                            email: user.email!,
                            name: user.user_metadata?.name || "ゲストユーザー",
                        });

                    if (insertError) {
                        console.log("ゲストユーザー追加エラー:", insertError);
                        // エラーでも続行
                    }
                }
            }
            // 空いている席を探す
            const positions = ["東", "南", "西", "北"];
            const occupiedPositions = players.map((p) => p.position);
            const availablePosition = positions.find(
                (pos) => !occupiedPositions.includes(pos)
            );

            if (!availablePosition) {
                throw new Error("卓が満席です");
            }

            const seatOrder = positions.indexOf(availablePosition) + 1;

            const { error } = await supabase.from("table_players").insert({
                table_id: tableId,
                user_id: user.id,
                position: availablePosition,
                seat_order: seatOrder,
                current_score: 25000,
            });

            if (error) throw error;

            await loadTableData();
        } catch (error: any) {
            alert(error.message || "卓への参加に失敗しました");
        } finally {
            setJoinLoading(false);
        }
    };

    const leaveTable = async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("table_players")
                .delete()
                .eq("table_id", tableId)
                .eq("user_id", user.id);

            if (error) throw error;

            // プレイヤーが減ったら卓のステータスを更新.
            await supabase
                .from("tables")
                .update({ status: "waiting " })
                .eq("id", tableId);

            await loadTableData();
        } catch (error: any) {
            alert(error.message || "卓からの退出に失敗しました");
        }
    };

    const addBotPlayers = async () => {
        if (!table) return;

        try {
            const positions = ["東", "南", "西", "北"];
            const occupiedPositions = players.map((p) => p.position);
            const availablePosition = positions.filter(
                (pos) => !occupiedPositions.includes(pos)
            );

            if (!availablePosition) {
                throw new Error("卓が満席です");
            }

            const botsToAdd = Math.min(availablePosition.length, 3)

            for (let i = 0; i < botsToAdd; i++) {
                // 1) 有効な UUIDを生成
                const botId = crypto.randomUUID()
                const position = availablePosition[i]
                const botName = `BOT${i + 1}`
                const botEmail = `${botId}@bot.example.com`

                // 2) usersテーブルへupsert
                const { error: userError } = await supabase.from("users").upsert({
                    id: botId,
                    email:botEmail,
                    name: botName,
                })

                if (userError) {
                    console.error("BOTユーザー作成エラー:", userError)
                    continue
                }

                //  3) table_playersへ追加
                const { error: playerError } = await supabase.from("table_players").insert({
                    table_id: tableId,
                    user_id: botId,
                    position,
                    seat_order: positions.indexOf(position) + 1,
                    current_score: 25000,
                })

                if (playerError) {
                    console.error("BOTプレイヤー追加エラー:", playerError)
                }
            }

            await loadTableData()
            alert(`${botsToAdd}体のBOTを追加しました`)
        } catch (error: any) {
            console.error("BOT追加エラー:", error)
            alert(error.message || "BOT追加に失敗しました")
        }
    };

    const startGame = async () => {
        if (players.length === 0) {
            alert("最低一人は参加してください")
            return
        }

        try {
            await supabase.from("tables").update({ status: "playing" }).eq("id", tableId)
            await loadTableData()
        } catch (error: any) {
            alert(error.message || "ゲーム開始に失敗しました")
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <header className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/room/${code}`}>
                                    <ArrowLeft className="h-6 w-6" />
                                </Link>
                            </Button>
                            <div className="ml-4">
                                <h1 className="text-x1 font-bold">
                                    {table?.name ?? "テーブル名"}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    ステータス:{" "}
                                    <Badge
                                        variant={
                                            table?.status === "playing"
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {table?.status === "playing"
                                            ? "対局中"
                                            : "待機中"}
                                    </Badge>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* 麻雀卓 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-x-2">
                            <Users className="h-5 w-5 text-green-600" />
                            麻雀卓 ({players.length}/4)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[450px]">
                        {/* 卓の配置 */}
                        <div className="relative mt-40 mb-40">
                            {/* 卓の中央 */}
                            <div className="w-48 h-48 mx-auto bg-green-100 rounded-lg border-4 border-green-300 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🀄</div>
                                    <div className="text-sm text-gray-600">
                                        {table?.name}
                                    </div>
                                    {table?.status === "playing" && (
                                        <div className="text-xs text-green-600 font-bold">
                                            対局中
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* プレイヤーの配置 */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-48 h-48">
                                    {/* 東（下） */}
                                    <div className="absolute left-1/2 top-full transform -translate-x-1/2 translate-y-4 pointer-events-auto">
                                        {eastPlayer ? (
                                            <PlayerCard
                                                player={eastPlayer}
                                                position="東"
                                            />
                                        ) : (
                                            <EmptyPlayerCard position="東" />
                                        )}
                                    </div>

                                    {/* 南（右） */}
                                    <div className="absolute top-1/2 left-full transform -translate-y-1/2 translate-x-4 pointer-events-auto">
                                        {southPlayer ? (
                                            <PlayerCard
                                                player={southPlayer}
                                                position="南"
                                            />
                                        ) : (
                                            <EmptyPlayerCard position="南" />
                                        )}
                                    </div>

                                    {/* 西（上） */}
                                    <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 -translate-y-4 pointer-events-auto">
                                        {westPlayer ? (
                                            <PlayerCard
                                                player={westPlayer}
                                                position="西"
                                            />
                                        ) : (
                                            <EmptyPlayerCard position="西" />
                                        )}
                                    </div>

                                    {/* 北（左） */}
                                    <div className="absolute top-1/2 right-full transform -translate-y-1/2 -translate-x-4 pointer-events-auto">
                                        {northPlayer ? (
                                            <PlayerCard
                                                player={northPlayer}
                                                position="北"
                                            />
                                        ) : (
                                            <EmptyPlayerCard position="北" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* アクションボタン */}
                        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-center gap-4 flex-wrap">
                            {!isPlayerInTable && players.length < 4 && (
                                <Button
                                    onClick={joinTable}
                                    disabled={joinLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {joinLoading ? "参加中..." : "卓に参加"}
                                </Button>
                            )}

                            {isPlayerInTable && table?.status === "waiting" && (
                                <Button
                                    onClick={leaveTable}
                                    variant="outline"
                                    className="bg-transparent"
                                >
                                    卓から退出
                                </Button>
                            )}

                            {players.length < 4 &&
                                table?.status === "waiting" && (
                                    <Button
                                        onClick={addBotPlayers}
                                        variant="outline"
                                        className="bg-transparent border-blue-500 text-blue-600 hover:bg-blue-50"
                                    >
                                        BOT追加
                                    </Button>
                                )}

                            {canStart && table?.status === "waiting" && (
                                <Button
                                    onClick={startGame}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    対局開始 ({players.length}人)
                                </Button>
                            )}

                            {/* 戦績入力ボタン - モーダルを開く */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
