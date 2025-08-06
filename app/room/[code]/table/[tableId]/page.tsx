"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerCard } from "@/components/features/tablepage/PlayerCard";
import { EmptyPlayerCard } from "@/components/features/tablepage/EmptyPlayerCard";
import SeatDialog from "@/components/features/tablepage/SeatDialog";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import type { TablePlayer } from "@/types/table";

type Table = {
    id: string;
    room_id: string;
    name: string;
    status: string;
    created_at: string;
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

export default function TablePage(props: {
    params: Promise<{ code: string; tableId: string }>;
}) {
    // NOTE: クライアントコンポーネントとして props.params を同期的に受け取る形にしています
    const { code, tableId } = use(props.params);

    const [table, setTable] = useState<Table | null>(null);
    const [players, setPlayers] = useState<TablePlayer[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [joinLoading, setJoinLoading] = useState(false);
    const [botLoading, setBotLoading] = useState(false);
    const [selectedSeatPosition, setSelectedSeatPosition] = useState<
        string | null
    >(null);
    const [selectedPlayer, setSelectedPlayer] = useState<TablePlayer | null>(
        null
    );
    const [isSeatDialogOpen, setIsSeatDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const { user, isGuest } = useAuth();

    // ビジネスルール
    const MIN_PLAYERS_TO_START = 1; // 変更したければここを編集

    const eastPlayer = players.find((p) => p.position === "東");
    const southPlayer = players.find((p) => p.position === "南");
    const westPlayer = players.find((p) => p.position === "西");
    const northPlayer = players.find((p) => p.position === "北");

    const isPlayerInTable =
        !!user && players.some((p) => p.user_id === user.id);
    const canStart = players.length >= MIN_PLAYERS_TO_START && isPlayerInTable;

    // テーブル・プレイヤー・ゲームデータをまとめて取得（APIコールを最小化）
    const loadTableData = async () => {
        setLoading(true);
        setError("");
        try {
            console.log("卓データ読み込み開始:", tableId);

            // 1) tables
            const { data: tableData, error: tableError } = await supabase
                .from("tables")
                .select("*")
                .eq("id", tableId)
                .single();

            if (tableError) {
                // 特定エラー処理（例）
                if ((tableError as any).code === "PGRST116") {
                    throw new Error("指定された卓は存在しません");
                }
                throw tableError;
            }
            setTable(tableData);

            // 2) table_players と users をリレーションで一回取得
            // supabase 側で foreign key が設定されている前提で `users(...)` のように取得できます
            const { data: playersData, error: playersError } = await supabase
                .from("table_players")
                .select("*, users(id, name, email)")
                .eq("table_id", tableId)
                .order("seat_order", { ascending: true });

            if (playersError && (playersError as any).code !== "42P01") {
                throw playersError;
            }
            // playersData may be null
            setPlayers((playersData as TablePlayer[]) || []);

            // 3) games（直近10件）
            const { data: gamesData, error: gamesError } = await supabase
                .from("games")
                .select("*")
                .eq("table_id", tableId)
                .order("created_at", { ascending: false })
                .limit(10);

            if (gamesError && (gamesError as any).code !== "42P01") {
                throw gamesError;
            }
            setGames(gamesData || []);
        } catch (err: any) {
            console.error("卓データ読み込みエラー:", err);
            setError(err?.message || "卓情報の取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // テーブルID が取れていない場合は読み込みしない
        if (!tableId) return;
        loadTableData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableId]);

    const joinTable = async () => {
        if (!user || !table) return;
        setJoinLoading(true);
        try {
            // ゲストユーザーのDB登録を保証（存在チェック + insert）
            if (isGuest || user.email?.endsWith("@guest.local")) {
                const { data: existingUser, error: checkError } = await supabase
                    .from("users")
                    .select("id")
                    .eq("id", user.id)
                    .single();

                if (checkError && (checkError as any).code === "PGRST116") {
                    const { error: insertError } = await supabase
                        .from("users")
                        .insert({
                            id: user.id,
                            email: user.email!,
                            name: user.user_metadata?.name || "ゲストユーザー",
                        });
                    if (insertError) {
                        console.warn(
                            "ゲストユーザー追加エラー（続行）:",
                            insertError
                        );
                    }
                }
            }

            // 空いている席を探す
            const positions = ["東", "南", "西", "北"];
            const occupiedPositions = players.map((p) => p.position);
            const available = positions.find(
                (pos) => !occupiedPositions.includes(pos)
            );
            if (!available) throw new Error("卓が満席です");

            const seatOrder = positions.indexOf(available) + 1;

            const { error } = await supabase.from("table_players").insert({
                table_id: tableId,
                user_id: user.id,
                position: available,
                seat_order: seatOrder,
                current_score: 25000,
            });

            if (error) throw error;

            await loadTableData();
        } catch (err: any) {
            // UNIQUE制約違反（同時着席）の場合
            if (err.code === "23505") {
                alert("その席はすでに埋まっています");
            } else {
                alert(err?.message || "卓への参加に失敗しました");
            }
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

            // ステータス更新（余分な空白を削除）
            await supabase
                .from("tables")
                .update({ status: "waiting" })
                .eq("id", tableId);

            await loadTableData();
        } catch (err: any) {
            alert(err?.message || "卓からの退出に失敗しました");
        }
    };

    // BOTをまとめて作る（バルクupsert + バルクinsert）
    const addBotPlayers = async () => {
        if (!table) return;
        setBotLoading(true);
        try {
            const positions = ["東", "南", "西", "北"];
            const occupiedPositions = players.map((p) => p.position);
            const availablePositions = positions.filter(
                (pos) => !occupiedPositions.includes(pos)
            );
            if (availablePositions.length === 0) {
                throw new Error("卓が満席です");
            }

            const botsToAdd = Math.min(availablePositions.length, 3);

            // まとめて users を upsert
            const botUsers = Array.from({ length: botsToAdd }).map((_, i) => {
                const botId = crypto.randomUUID();
                return {
                    id: botId,
                    email: `${botId}@bot.example.com`,
                    name: `BOT${i + 1}`,
                };
            });

            // 先に users を upsert（バルク）
            const { error: usersError } = await supabase
                .from("users")
                .upsert(botUsers);
            if (usersError) {
                console.error("BOT users upsert error:", usersError);
                // 続行はする（既に存在する等の理由で失敗する可能性あり）
            }

            // users の id を参照して table_players を作る
            const botPlayers = botUsers.map((u, i) => ({
                table_id: tableId,
                user_id: u.id,
                position: availablePositions[i],
                seat_order: positions.indexOf(availablePositions[i]) + 1,
                current_score: 25000,
            }));

            const { error: playersError } = await supabase
                .from("table_players")
                .insert(botPlayers);
            if (playersError) {
                console.error("BOT players insert error:", playersError);
                throw playersError;
            }

            await loadTableData();
            alert(`${botsToAdd}体のBOTを追加しました`);
        } catch (err: any) {
            console.error("BOT追加エラー:", err);
            alert(err?.message || "BOT追加に失敗しました");
        } finally {
            setBotLoading(false);
        }
    };

    const startGame = async () => {
        if (players.length < MIN_PLAYERS_TO_START) {
            alert(`最低${MIN_PLAYERS_TO_START}人は参加してください`);
            return;
        }
        try {
            await supabase
                .from("tables")
                .update({ status: "playing" })
                .eq("id", tableId);
            await loadTableData();
        } catch (err: any) {
            alert(err?.message || "ゲーム開始に失敗しました");
        }
    };

    // クリックでモーダル開くハンドラ（Empty と Player 両方から呼ぶ）
    const openSeatDialog = (position: string, player?: TablePlayer) => {
        setSelectedSeatPosition(position);
        setSelectedPlayer(player ?? null);
        setIsSeatDialogOpen(true);
    };

    // 着席（Empty -> insert） 移動（既存 player -> update position & seat_order)
    const handleSitOrMove = async (toPosition: string) => {
        if (!user || !table) {
            alert("ログインしてください");
            return;
        }
        setActionLoading(true);
        try {
            const positions = ["東", "南", "西", "北"];
            const seat_order = positions.indexOf(toPosition) + 1;

            // まず自分が卓にいるか確認
            const myPlayer = players.find((p) => p.user_id === user.id);

            if (!myPlayer) {
                // まだ卓にいない → INSERT（着席）
                const { error } = await supabase.from("table_players").insert({
                    table_id: tableId,
                    user_id: user.id,
                    position: toPosition,
                    seat_order,
                    current_score: 25000,
                });

                if (error) throw error;
                await loadTableData();
                setIsSeatDialogOpen(false);
                return;
            }

            // 自分がすでに座っている場合 → 移動（UPDATE）
            // 単純に自分の row を更新して移動する
            // NOTE: UNIQUE 成約があるため、同時移動の競合で 23505 が返る可能性あり
            const { error } = await supabase
                .from("table_players")
                .update({ position: toPosition, seat_order })
                .eq("id", myPlayer.id);

            if (error) throw error;
            await loadTableData();
            setIsSeatDialogOpen(false);
        } catch (err: any) {
            // UNIQUE違反などは 23505 を返す（Postgres）
            if (
                err.code === "23505" ||
                (err?.details && String(err.details).includes("duplicate"))
            ) {
                alert("その席はすでに埋まっています。最新の状況を取得します。");
                await loadTableData();
            } else {
                alert(err?.message || "着席/移動に失敗しました");
            }
        } finally {
            setActionLoading(false);
        }
    };

    // 退席（delete）
    const handleLeave = async (playerId?: string) => {
        if (!playerId && !user) return;
        setActionLoading(true);
        try {
            const targetUserId = playerId ?? user!.id;
            const { error } = await supabase
                .from("table_players")
                .delete()
                .eq("table_id", tableId)
                .eq("user_id", targetUserId);

            if (error) throw error;
            await loadTableData();
            setIsSeatDialogOpen(false);
        } catch (err: any) {
            alert(err?.message || "退席に失敗しました");
        } finally {
            setActionLoading(false);
        }
    };

    // BOT追加
    const addBotAtPosition = async (position: string) => {
        if (!table) return;
        setActionLoading(true);
        try {
            // 1) bot user を作る
            const botId = crypto.randomUUID();
            const botUser = {
                id: botId,
                email: `${botId}@bot.example.com`,
                name: `BOT(${position})`,
            };

            // upsert user
            const { error: usersError } = await supabase
                .from("users")
                .upsert(botUser);
            if (usersError) {
                console.error("BOT user upsert error:", usersError);
                // 続行するか判断（この例では進める）
            }

            // 2) table_players に挿入
            const positions = ["東", "南", "西", "北"];
            const seat_order = positions.indexOf(position) + 1;

            const { error: insertError } = await supabase
                .from("table_players")
                .insert({
                    table_id: tableId,
                    user_id: botId,
                    position,
                    seat_order,
                    current_score: 25000,
                });

            if (insertError) {
                // UNIQUE 競合などの可能性をハンドル
                if ((insertError as any).code === "23505") {
                    alert("その席はすでに埋まっています（BOT追加に失敗）");
                } else {
                    throw insertError;
                }
            } else {
                await loadTableData();
            }
        } catch (err: any) {
            console.error("addBotAtPosition error:", err);
            alert(err?.message || "BOTの追加に失敗しました");
        } finally {
            setActionLoading(false);
        }
    };

    // 強制退席（targetUserId）: 実行前に権限チェックを必ず行ってね
    const forceLeaveUser = async (targetUserId: string) => {
        // 例: isAdmin フラグがあるならそれをチェック
        if (!user) {
            alert("ログインしてください");
            return;
        }
        // ここで権限チェック。ダミー例:
        const currentIsAdmin = (user as any).is_admin === true; // もしくは別の判定方法
        if (!currentIsAdmin) {
            alert("権限がありません");
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from("table_players")
                .delete()
                .eq("table_id", tableId)
                .eq("user_id", targetUserId);

            if (error) throw error;
            await loadTableData();
        } catch (err: any) {
            console.error("forceLeaveUser error:", err);
            alert(err?.message || "強制退席に失敗しました");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
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
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-x-2">
                            <Users className="h-5 w-5 text-green-600" />
                            麻雀卓 ({players.length}/4)
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="min-h-[450px]">
                        <div className="relative mt-40 mb-40">
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

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-48 h-48">
                                    <div className="absolute left-1/2 top-full transform -translate-x-1/2 translate-y-4 pointer-events-auto">
                                        {eastPlayer ? (
                                            <PlayerCard
                                                player={eastPlayer}
                                                position="東"
                                                onClick={() =>
                                                    openSeatDialog(
                                                        "東",
                                                        eastPlayer
                                                    )
                                                }
                                            />
                                        ) : (
                                            <EmptyPlayerCard
                                                position="東"
                                                onClick={() =>
                                                    openSeatDialog("東")
                                                }
                                            />
                                        )}
                                    </div>
                                    <div className="absolute top-1/2 left-full transform -translate-y-1/2 translate-x-4 pointer-events-auto">
                                        {southPlayer ? (
                                            <PlayerCard
                                                player={southPlayer}
                                                position="南"
                                                onClick={() =>
                                                    openSeatDialog(
                                                        "南",
                                                        southPlayer
                                                    )
                                                }
                                            />
                                        ) : (
                                            <EmptyPlayerCard
                                                position="南"
                                                onClick={() =>
                                                    openSeatDialog("南")
                                                }
                                            />
                                        )}
                                    </div>
                                    <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 -translate-y-4 pointer-events-auto">
                                        {westPlayer ? (
                                            <PlayerCard
                                                player={westPlayer}
                                                position="西"
                                                onClick={() =>
                                                    openSeatDialog(
                                                        "西",
                                                        westPlayer
                                                    )
                                                }
                                            />
                                        ) : (
                                            <EmptyPlayerCard
                                                position="西"
                                                onClick={() =>
                                                    openSeatDialog("西")
                                                }
                                            />
                                        )}
                                    </div>
                                    <div className="absolute top-1/2 right-full transform -translate-y-1/2 -translate-x-4 pointer-events-auto">
                                        {northPlayer ? (
                                            <PlayerCard
                                                player={northPlayer}
                                                position="北"
                                                onClick={() =>
                                                    openSeatDialog(
                                                        "北",
                                                        northPlayer
                                                    )
                                                }
                                            />
                                        ) : (
                                            <EmptyPlayerCard
                                                position="北"
                                                onClick={() =>
                                                    openSeatDialog("北")
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-center gap-4 flex-wrap">
                            {!isPlayerInTable && players.length < 4 && (
                                <Button
                                    onClick={joinTable}
                                    disabled={joinLoading}
                                >
                                    {joinLoading ? "参加中..." : "卓に参加"}
                                </Button>
                            )}

                            {isPlayerInTable && table?.status === "waiting" && (
                                <Button onClick={leaveTable} variant="outline">
                                    卓から退出
                                </Button>
                            )}

                            {players.length < 4 &&
                                table?.status === "waiting" && (
                                    <Button
                                        onClick={addBotPlayers}
                                        variant="outline"
                                        disabled={botLoading}
                                    >
                                        {botLoading ? "追加中..." : "BOT追加"}
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
                        </div>
                    </CardContent>
                </Card>
                {error && <div className="text-red-600 mt-2">{error}</div>}

                <SeatDialog
                    open={isSeatDialogOpen}
                    onClose={() => setIsSeatDialogOpen(false)}
                    position={selectedSeatPosition}
                    player={selectedPlayer}
                    onSit={() =>
                        selectedSeatPosition &&
                        handleSitOrMove(selectedSeatPosition)
                    }
                    onLeave={() => handleLeave(selectedPlayer?.user_id)}
                    onAddBot={(pos) => addBotAtPosition(pos)}
                    onForceLeave={(targetUserId) =>
                        forceLeaveUser(targetUserId)
                    }
                    loading={actionLoading}
                    players={players}
                    currentUserId={user?.id ?? null}
                    canForceLeave={
                        /* true なら強制退席ボタンを表示する */ (user as any)
                            ?.is_admin === true
                    }
                />
            </div>
        </div>
    );
}
