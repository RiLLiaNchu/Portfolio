"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DebugPage() {
    const { authUser } = useAuth();
    const [rooms, setRooms] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [setupLoading, setSetupLoading] = useState(false);
    const [setupStatus, setSetupStatus] = useState<string[]>([]);

    const addStatus = (message: string) => {
        setSetupStatus((prev) => [
            ...prev,
            `${new Date().toLocaleTimeString()}: ${message}`,
        ]);
    };

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            console.log("データ読み込み開始...");

            // 全ルーム取得
            const { data: roomsData, error: roomsError } = await supabase
                .from("rooms")
                .select("*")
                .order("created_at", { ascending: false });

            if (roomsError) throw roomsError;
            setRooms(roomsData || []);

            // 全ユーザー取得
            const { data: usersData, error: usersError } = await supabase
                .from("users")
                .select("*")
                .order("created_at", { ascending: false });

            if (usersError) throw usersError;
            setUsers(usersData || []);
        } catch (error: any) {
            console.error("データ取得エラー:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const setupDatabase = async () => {
        setSetupLoading(true);
        setError("");
        setSetupStatus([]);

        try {
            addStatus("データベースセットアップ開始...");

            // 1. usersテーブル作成
            addStatus("usersテーブル作成中...");
            const { error: usersError } = await supabase.rpc("exec_sql", {
                sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            avatar_url TEXT,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
            });

            if (usersError) {
                console.log("RPC使用不可、直接作成を試行...");
                // RPC関数が使えない場合の代替手段
                await createTableDirectly();
            } else {
                addStatus("✅ usersテーブル作成完了");
            }

            // 2. roomsテーブル作成
            addStatus("roomsテーブル作成中...");
            const { error: roomsError } = await supabase.rpc("exec_sql", {
                sql: `
          CREATE TABLE IF NOT EXISTS rooms (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            code VARCHAR(4) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
          );
        `,
            });

            if (!roomsError) {
                addStatus("✅ roomsテーブル作成完了");
            }

            // 3. room_membersテーブル作成
            addStatus("room_membersテーブル作成中...");
            const { error: membersError } = await supabase.rpc("exec_sql", {
                sql: `
          CREATE TABLE IF NOT EXISTS room_members (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            room_id UUID,
            user_id UUID,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(room_id, user_id)
          );
        `,
            });

            if (!membersError) {
                addStatus("✅ room_membersテーブル作成完了");
            }

            // 2. 外部キー制約を追加
            addStatus("外部キー制約追加中...");
            const constraintSQL = `
        -- rooms テーブルの外部キー制約
        ALTER TABLE rooms 
        DROP CONSTRAINT IF EXISTS rooms_created_by_fkey,
        ADD CONSTRAINT rooms_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

        -- room_members テーブルの外部キー制約
        ALTER TABLE room_members 
        DROP CONSTRAINT IF EXISTS room_members_room_id_fkey,
        ADD CONSTRAINT room_members_room_id_fkey 
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

        ALTER TABLE room_members 
        DROP CONSTRAINT IF EXISTS room_members_user_id_fkey,
        ADD CONSTRAINT room_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `;

            const { error: constraintError } = await supabase.rpc("exec_sql", {
                sql: constraintSQL,
            });
            if (constraintError) {
                addStatus(
                    `⚠️ 外部キー制約追加に失敗: ${constraintError.message}`
                );
            } else {
                addStatus("✅ 外部キー制約追加完了");
            }

            // 4. 現在のユーザーを追加
            if (authUser) {
                addStatus("現在のユーザーを追加中...");
                const { error: userError } = await supabase
                    .from("users")
                    .upsert({
                        id: authUser.id,
                        email: authUser.email!,
                        name:
                            authUser.user_metadata?.name ||
                            authUser.email!.split("@")[0],
                    });

                if (userError) {
                    addStatus(`❌ ユーザー追加エラー: ${userError.message}`);
                } else {
                    addStatus("✅ ユーザー追加完了");
                }

                // 5. テストルーム作成
                addStatus("テストルーム作成中...");
                const { data: roomData, error: roomError } = await supabase
                    .from("rooms")
                    .upsert({
                        code: "1234",
                        name: "テストルーム",
                        created_by: authUser.id,
                        expires_at: new Date(
                            Date.now() + 24 * 60 * 60 * 1000
                        ).toISOString(),
                    })
                    .select()
                    .single();

                if (roomError) {
                    addStatus(`❌ ルーム作成エラー: ${roomError.message}`);
                } else {
                    addStatus("✅ ルーム作成完了");

                    // 6. ルームメンバーに追加
                    addStatus("ルームメンバー追加中...");
                    const { error: memberError } = await supabase
                        .from("room_members")
                        .upsert({
                            room_id: roomData.id,
                            user_id: authUser.id,
                        });

                    if (memberError) {
                        addStatus(
                            `❌ メンバー追加エラー: ${memberError.message}`
                        );
                    } else {
                        addStatus("✅ メンバー追加完了");
                    }
                }
            }

            addStatus("🎉 データベースセットアップ完了！");
            await loadData();
        } catch (error: any) {
            console.error("セットアップエラー:", error);
            addStatus(`❌ セットアップエラー: ${error.message}`);
            setError(`セットアップエラー: ${error.message}`);
        } finally {
            setSetupLoading(false);
        }
    };

    const createTableDirectly = async () => {
        // RPC関数が使えない場合の代替手段
        // 実際にはSupabaseのSQL Editorで手動実行が必要
        addStatus("⚠️ 自動作成に失敗。手動でのSQL実行が必要です");
    };

    const syncCurrentUser = async () => {
        if (!authUser) return;

        try {
            const { error } = await supabase.from("users").upsert(
                {
                    id: authUser.id,
                    email: authUser.email!,
                    name:
                        authUser.user_metadata?.name ||
                        authUser.email!.split("@")[0],
                },
                {
                    onConflict: "id",
                }
            );

            if (error) throw error;
            alert("ユーザー情報同期完了");
            loadData();
        } catch (error: any) {
            alert(`同期エラー: ${error.message}`);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            デバッグ情報
                            <Button asChild variant="outline">
                                <Link href="/home">ホームに戻る</Link>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="text-red-600 bg-red-50 p-2 rounded">
                                エラー: {error}
                            </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                            <Button
                                onClick={setupDatabase}
                                disabled={setupLoading}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {setupLoading
                                    ? "セットアップ中..."
                                    : "🔧 データベースセットアップ"}
                            </Button>

                            <Button onClick={loadData} disabled={loading}>
                                {loading ? "読み込み中..." : "データ再読み込み"}
                            </Button>

                            <Button onClick={syncCurrentUser} variant="outline">
                                ユーザー情報同期
                            </Button>
                        </div>

                        {setupStatus.length > 0 && (
                            <div className="bg-gray-100 p-3 rounded">
                                <h4 className="font-medium mb-2">
                                    セットアップ状況:
                                </h4>
                                <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                                    {setupStatus.map((status, index) => (
                                        <div key={index} className="font-mono">
                                            {status}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>手動セットアップ手順（推奨）</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <p className="font-medium text-yellow-800 mb-2">
                                ⚠️ 自動セットアップが失敗する場合
                            </p>
                            <p>
                                以下の手順でSupabaseダッシュボードから手動実行してください：
                            </p>
                        </div>

                        <ol className="list-decimal list-inside space-y-2">
                            <li>
                                <strong>Supabaseダッシュボード</strong> →{" "}
                                <strong>SQL Editor</strong> を開く
                            </li>
                            <li>
                                以下のSQLを<strong>順番に</strong>実行:
                            </li>
                        </ol>

                        <div className="space-y-3">
                            <div>
                                <h5 className="font-medium">
                                    1. usersテーブル:
                                </h5>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {`CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                                </pre>
                            </div>

                            <div>
                                <h5 className="font-medium">
                                    2. roomsテーブル:
                                </h5>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {`CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);`}
                                </pre>
                            </div>

                            <div>
                                <h5 className="font-medium">
                                    3. room_membersテーブル:
                                </h5>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {`CREATE TABLE IF NOT EXISTS room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID,
  user_id UUID,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);`}
                                </pre>
                            </div>

                            <div>
                                <h5 className="font-medium">
                                    4. あなたのユーザー情報:
                                </h5>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {`INSERT INTO users (id, email, name) VALUES
('${authUser?.id}', '${authUser?.email}', '${
                                        authUser?.user_metadata?.name ||
                                        authUser?.email?.split("@")[0]
                                    }')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();`}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>ルーム一覧 ({rooms.length}件)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rooms.length === 0 ? (
                            <p className="text-gray-500">ルームがありません</p>
                        ) : (
                            <div className="space-y-2">
                                {rooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="p-3 bg-gray-100 rounded"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div>
                                                    <strong>コード:</strong>{" "}
                                                    {room.code}
                                                </div>
                                                <div>
                                                    <strong>名前:</strong>{" "}
                                                    {room.name}
                                                </div>
                                                <div>
                                                    <strong>作成者:</strong>{" "}
                                                    {room.created_by}
                                                </div>
                                                <div>
                                                    <strong>期限:</strong>{" "}
                                                    {new Date(
                                                        room.expires_at
                                                    ).toLocaleString()}
                                                </div>
                                            </div>
                                            <Button size="sm" asChild>
                                                <Link
                                                    href={`/room/${room.code}`}
                                                >
                                                    参加
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>ユーザー一覧 ({users.length}件)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <p className="text-gray-500">
                                ユーザーがありません
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="p-2 bg-gray-100 rounded"
                                    >
                                        <div>
                                            <strong>ID:</strong> {user.id}
                                        </div>
                                        <div>
                                            <strong>名前:</strong> {user.name}
                                        </div>
                                        <div>
                                            <strong>メール:</strong>{" "}
                                            {user.email}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
