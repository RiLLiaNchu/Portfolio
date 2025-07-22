"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface TablePlayer {
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
}

interface GameStats {
  user_id: string;
  is_dealer: boolean;
  win_count: number;
  total_win_points: number;
  deal_in_count: number;
  total_deal_in_points: number;
  riichi_count: number;
  call_count: number;
  final_score: number; // 最終点棒
  rank: number; // 順位
}

export type GameStat = {
  table_id: string;         // 対象テーブル
  game_number: number;      // 何戦目か
  user_id: string;          // プレイヤーの Supabase UID
  final_score: number;
  rank: number;
  bonus?: number;
  is_dealer?: boolean;
  win_count?: number;
  total_win_points?: number;
  deal_in_count?: number;
  total_deal_in_points?: number;
  riichi_count?: number;
  call_count?: number;
};

const [gameStats, setGameStats] = useState<GameStat[]>([
  // 初期値は4人分の空データ（必要に応じて user_id は設定）
  { table_id: "xxx", game_number: 1, user_id: "", final_score: 0, rank: 1, bonus: 0, is_dealer: false, win_count: 0, total_win_points: 0, deal_in_count: 0, total_deal_in_points: 0, riichi_count: 0, call_count: 0 },
  { table_id: "xxx", game_number: 1, user_id: "", final_score: 0, rank: 2, bonus: 0, is_dealer: false, win_count: 0, total_win_points: 0, deal_in_count: 0, total_deal_in_points: 0, riichi_count: 0, call_count: 0 },
  { table_id: "xxx", game_number: 1, user_id: "", final_score: 0, rank: 3, bonus: 0, is_dealer: false, win_count: 0, total_win_points: 0, deal_in_count: 0, total_deal_in_points: 0, riichi_count: 0, call_count: 0 },
  { table_id: "xxx", game_number: 1, user_id: "", final_score: 0, rank: 4, bonus: 0, is_dealer: false, win_count: 0, total_win_points: 0, deal_in_count: 0, total_deal_in_points: 0, riichi_count: 0, call_count: 0 },
]);

export default function GameStatsPage({
  params,
}: {
  params: { code: string; tableId: string };
}) {
  const [players, setPlayers] = useState<TablePlayer[]>([]);
  const [currentGame, setCurrentGame] = useState(1);
  const [maxGames, setMaxGames] = useState(8); // 東風戦なら4局、半荘なら8局
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadTableData();
  }, [user, params.tableId, router]);

  const loadTableData = async () => {
    try {
      console.log("卓データ読み込み開始:", params.tableId);

      // プレイヤー情報を取得
      const { data: playersData, error: playersError } = await supabase
        .from("table_players")
        .select("*")
        .eq("table_id", params.tableId)
        .order("seat_order", { ascending: true });

      if (playersError) throw playersError;

      // 各プレイヤーのユーザー情報を個別に取得
      const playersWithUsers = await Promise.all(
        (playersData || []).map(async (player) => {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", player.user_id)
            .single();

          if (userError) {
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

      // 初期選択プレイヤーを現在のユーザーに設定
      if (user && playersWithUsers.length > 0) {
        const currentUserPlayer = playersWithUsers.find(
          (p) => p.user_id === user.id
        );
        setSelectedPlayer(
          currentUserPlayer?.user_id || playersWithUsers[0].user_id
        );
      }

      // 統計データの初期化
      const initialStats = playersWithUsers.map((player) => ({
        user_id: player.user_id,
        is_dealer: player.position === "東",
        win_count: 0,
        total_win_points: 0,
        deal_in_count: 0,
        total_deal_in_points: 0,
        riichi_count: 0,
        call_count: 0,
        final_score: 25000, // デフォルト点棒
        rank: 1, // デフォルト順位
      }));
      setGameStats(initialStats);
    } catch (error: any) {
      console.error("卓データ読み込みエラー:", error);
      setError(error.message || "卓情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerStats = (
    userId: string,
    field: keyof GameStats,
    value: any
  ) => {
    setGameStats((prev) =>
      prev.map((stats) =>
        stats.user_id === userId ? { ...stats, [field]: value } : stats
      )
    );
  };

  // 選択中プレイヤーの統計情報を毎回取得
  const currentStats = gameStats.find(
    (stats) => stats.user_id === selectedPlayer
  );

const submitGameStats = async (gameStats: GameStat[]) => {
  const { data, error } = await supabase.from("game_stats").insert(gameStats);

  if (error) {
    console.error("Insert failed", error);
    throw error;
  }

  return data;
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <div className="text-red-600 mb-4">❌</div>
            <h2 className="text-xl font-bold mb-2">エラー</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href={`/room/${params.code}/table/${params.tableId}`}>
                卓に戻る
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPlayerInfo = players.find((p) => p.user_id === selectedPlayer);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/room/${params.code}/table/${params.tableId}`}>
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold ml-4">戦績入力</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 試合ナビゲーション */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentGame(Math.max(1, currentGame - 1))}
                disabled={currentGame <= 1}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentGame}試合目
                </div>
                <div className="text-sm text-gray-600">全{maxGames}試合</div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentGame(Math.min(maxGames, currentGame + 1))
                }
                disabled={currentGame >= maxGames}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 選択中プレイヤー表示 */}
        {selectedPlayerInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="/placeholder.svg?height=48&width=48" />
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {selectedPlayerInfo.users.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl">{selectedPlayerInfo.users.name}</div>
                  <div className="text-sm text-gray-600 font-normal">
                    {selectedPlayerInfo.position}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* 統計入力フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>試合統計</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 起家チェック */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dealer"
                checked={!!currentStats?.is_dealer}
                onCheckedChange={(checked) =>
                  updatePlayerStats(
                    selectedPlayer,
                    "is_dealer",
                    Boolean(checked)
                  )
                }
              />
              <Label htmlFor="dealer" className="text-lg">
                起家（親番）
              </Label>
            </div>

            {/* 和了関連 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="winCount">和了数</Label>
                <Input
                  id="winCount"
                  type="number"
                  min="0"
                  value={currentStats?.win_count ?? 0}
                  onChange={(e) =>
                    updatePlayerStats(
                      selectedPlayer,
                      "win_count",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className="text-center text-lg"
                />
              </div>
              <div>
                <Label htmlFor="totalWinPoints">総和了点</Label>
                <Input
                  id="totalWinPoints"
                  type="number"
                  min="0"
                  step="100"
                  value={currentStats?.total_win_points ?? 0}
                  onChange={(e) =>
                    updatePlayerStats(
                      selectedPlayer,
                      "total_win_points",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className="text-center text-lg"
                />
              </div>
            </div>

            {/* 放銃関連 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dealInCount">放銃数</Label>
                <Input
                  id="dealInCount"
                  type="number"
                  min="0"
                  value={currentStats?.deal_in_count ?? 0}
                  onChange={(e) =>
                    updatePlayerStats(
                      selectedPlayer,
                      "deal_in_count",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className="text-center text-lg"
                />
              </div>
              <div>
                <Label htmlFor="totalDealInPoints">総放銃点</Label>
                <Input
                  id="totalDealInPoints"
                  type="number"
                  min="0"
                  step="100"
                  value={currentStats?.total_deal_in_points ?? 0}
                  onChange={(e) =>
                    updatePlayerStats(
                      selectedPlayer,
                      "total_deal_in_points",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className="text-center text-lg"
                />
              </div>
            </div>

            {/* 最終点棒・順位・その他統計 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="finalScore">最終点棒</Label>
                <Input
                  id="finalScore"
                  type="number"
                  min="0"
                  step="100"
                  value={currentStats?.final_score ?? 0}
                  onChange={(e) =>
                    updatePlayerStats(
                      selectedPlayer,
                      "final_score",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className="text-center text-lg"
                />
              </div>
              <div>
                <Label htmlFor="rank">順位</Label>
                <Input
                  id="rank"
                  type="number"
                  min="1"
                  max={players.length}
                  value={currentStats?.rank ?? 1}
                  onChange={(e) =>
                    updatePlayerStats(
                      selectedPlayer,
                      "rank",
                      Number.parseInt(e.target.value) || 1
                    )
                  }
                  className="text-center text-lg"
                />
              </div>
              <div>
                <Label htmlFor="riichiCount">立直数</Label>
                <Input
                  id="riichiCount"
                  type="number"
                  min="0"
                  value={currentStats?.riichi_count ?? 0}
                  onChange={(e) =>
                    updatePlayerStats(
                      selectedPlayer,
                      "riichi_count",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className="text-center text-lg"
                />
              </div>
              <div>
                <Label htmlFor="callCount">副露数</Label>
                <Input
                  id="callCount"
                  type="number"
                  min="0"
                  value={currentStats?.call_count ?? 0}
                  onChange={(e) =>
                    updatePlayerStats(
                      selectedPlayer,
                      "call_count",
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className="text-center text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 他の対局者選択 */}
        <Card>
          <CardHeader>
            <CardTitle>対局者選択</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {players.map((player) => (
                <Button
                  key={player.id}
                  variant={
                    selectedPlayer === player.user_id ? "default" : "outline"
                  }
                  className={`p-4 h-auto ${
                    selectedPlayer === player.user_id
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-transparent"
                  }`}
                  onClick={() => setSelectedPlayer(player.user_id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback
                        className={
                          selectedPlayer === player.user_id
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {player.users.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{player.users.name}</div>
                      <div className="text-sm opacity-70">
                        {player.position}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 入力完了ボタン */}
        <Button
          onClick={async () => {
            try {
              const mappedStats: GameStat[] = gameStats.map((stat) => ({
                table_id: params.tableId,
                game_number: currentGame,
                user_id: stat.user_id,
                final_score: stat.final_score,
                rank: stat.rank,
                bonus: 0,
                is_dealer: stat.is_dealer,
                win_count: stat.win_count,
                total_win_points: stat.total_win_points,
                deal_in_count: stat.deal_in_count,
                total_deal_in_points: stat.total_deal_in_points,
                riichi_count: stat.riichi_count,
                call_count: stat.call_count,
              }));

              console.log("送信するデータ:", mappedStats);

              await submitGameStats(mappedStats);
              alert("保存しました！");
            } catch (e) {
              alert("保存に失敗しました。");
              console.error("保存エラー:", e);
            }
          }}
        >
          保存する
        </Button>
      </div>
    </div>
  );
}
