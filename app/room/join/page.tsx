"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Plus, Clock } from "lucide-react";

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentRooms, setRecentRooms] = useState<any[]>([]);
  const { user, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isGuest) {
      loadRecentRooms();
    }
  }, [user, isGuest, router]);

  const loadRecentRooms = async () => {
    try {
      if (!user?.id || isGuest) return;

      // まずテーブルが存在するかチェック
      const { data, error } = await supabase
        .from("room_members")
        .select(
          `
        rooms (
          id,
          code,
          name,
          created_at
        )
      `
        )
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })
        .limit(3);

      if (error) {
        console.warn("最近のルーム取得エラー:", error);
        // テーブルが存在しない場合やリレーションエラーの場合は空配列を設定
        setRecentRooms([]);
        return;
      }

      // データが正常に取得できた場合のみ設定
      const validRooms = (data || []).filter((item) => item.rooms !== null);
      setRecentRooms(validRooms);
    } catch (error) {
      console.error("最近のルーム取得エラー:", error);
      setRecentRooms([]);
    }
  };

  const generateRoomCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(code);
  };

  const ensureUserInDatabase = async () => {
    if (!user) return false;

    try {
      // ユーザーがDBに存在するか確認
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (
        checkError &&
        (checkError.code === "PGRST116" ||
          checkError.message.includes("no rows"))
      ) {
        // ユーザーが存在しない場合は追加
        console.log("ユーザーをDBに追加中...");
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email!,
          name:
            user.user_metadata?.name ||
            user.email!.split("@")[0] ||
            "Unknown User",
        });

        if (insertError) {
          console.error("ユーザー追加エラー:", insertError);
          // エラーでも続行（ゲスト機能のため）
        } else {
          console.log("✅ ユーザーDB追加完了");
        }
      }

      return true;
    } catch (error) {
      console.error("ユーザー確認エラー:", error);
      return true; // エラーでも続行
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length !== 4) {
      setError("4桁のルームコードを入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("ルーム参加処理開始:", {
        roomCode,
        userId: user?.id,
        isGuest,
      });

      // ユーザーがDBに存在することを確認
      await ensureUserInDatabase();

      // ルームが存在するかチェック
      const { data: existingRoom, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode)
        .single();

      console.log("ルーム検索結果:", { existingRoom, roomError });

      let roomId: string;

      if (roomError && roomError.code === "PGRST116") {
        // ルームが存在しない場合は新規作成
        console.log("新規ルーム作成中...");
        const { data: newRoom, error: createError } = await supabase
          .from("rooms")
          .insert({
            code: roomCode,
            name: `ルーム ${roomCode}`,
            created_by: user?.id,
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .select()
          .single();

        console.log("新規ルーム作成結果:", { newRoom, createError });

        if (createError) {
          console.error("ルーム作成エラー:", createError);
          throw new Error(`ルーム作成に失敗しました: ${createError.message}`);
        }
        roomId = newRoom.id;
      } else if (roomError) {
        console.error("ルーム検索エラー:", roomError);
        throw new Error(`ルーム検索に失敗しました: ${roomError.message}`);
      } else {
        roomId = existingRoom.id;
        console.log("既存ルーム発見:", roomId);
      }

      console.log("ルームメンバー追加中...", { roomId, userId: user?.id });

      // ルームメンバーに追加
      const { error: memberError } = await supabase.from("room_members").upsert(
        {
          room_id: roomId,
          user_id: user?.id,
        },
        { onConflict: "room_id,user_id" }
      );

      console.log("メンバー追加結果:", { memberError });

      if (memberError) {
        console.error("メンバー追加エラー:", memberError);
        throw new Error(`メンバー追加に失敗しました: ${memberError.message}`);
      }

      console.log("ルーム参加成功、リダイレクト中...");
      router.push(`/room/${roomCode}`);
    } catch (error: any) {
      console.error("ルーム参加エラー:", error);
      setError(error.message || "ルーム参加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/home">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold ml-4">ルーム参加</h1>
            {isGuest && (
              <div className="ml-auto">
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  ゲスト
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ゲスト利用の注意 */}
        {isGuest && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600">ℹ️</div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">
                    ゲスト利用中
                  </h4>
                  <p className="text-sm text-blue-700">
                    ルーム参加・対局が可能です。ブラウザを閉じると履歴は消えますが、継続利用には
                    <Link
                      href="/signup"
                      className="underline hover:no-underline"
                    >
                      会員登録
                    </Link>
                    をおすすめします。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ルーム参加 */}
        <Card>
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto text-green-600 mb-2" />
            <CardTitle>ルームに参加</CardTitle>
            <CardDescription>
              4桁のルームコードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">ルームコード</Label>
                <Input
                  id="roomCode"
                  type="text"
                  placeholder="1234"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className="text-center text-3xl font-mono tracking-widest h-16"
                  maxLength={4}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
                disabled={loading || roomCode.length !== 4}
              >
                {loading ? "参加中..." : "ルームに参加"}
              </Button>
            </form>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <div>ユーザーID: {user?.id}</div>
                <div>ゲスト: {isGuest ? "はい" : "いいえ"}</div>
                <div>入力コード: {roomCode}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 新規ルーム作成 */}
        <Card>
          <CardHeader className="text-center">
            <Plus className="h-12 w-12 mx-auto text-red-600 mb-2" />
            <CardTitle>新しいルーム作成</CardTitle>
            <CardDescription>新しいルームを作成して友人を招待</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={generateRoomCode}
              variant="outline"
              className="w-full py-6 bg-transparent"
            >
              ランダムコード生成
            </Button>
            <Button
              onClick={handleJoinRoom}
              className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg"
              disabled={roomCode.length !== 4}
            >
              ルーム作成
            </Button>
          </CardContent>
        </Card>

        {/* 最近のルーム（ゲスト以外） */}
        {!isGuest && recentRooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                最近のルーム
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentRooms.map((roomMember: any) => {
                const room = roomMember.rooms;
                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{room.name}</div>
                      <div className="text-sm text-gray-600">
                        コード: {room.code}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(room.created_at).toLocaleDateString("ja-JP")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      asChild
                    >
                      <Link href={`/room/${room.code}`}>再入室</Link>
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
