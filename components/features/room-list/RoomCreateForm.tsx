import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { joinRoom } from "@/lib/api/rooms";

export const RoomCreateForm = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const router = useRouter();

    // ルーム作成モーダル用ステート
    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomPassword, setNewRoomPassword] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // ルーム作成処理
    const handleCreateRoom = async () => {
        setCreateError("");

        if (!newRoomName.trim()) {
            setCreateError("ルーム名は必須です");
            return;
        }
        if (!/^\d{4}$/.test(newRoomPassword)) {
            setCreateError("パスワードは4桁の数字で入力してください");
            return;
        }

        setCreating(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインしてください");

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 例: 24時間後に自動削除予定

            // ルーム作成
            const { data, error } = await supabase
                .from("rooms")
                .insert([
                    {
                        name: newRoomName,
                        password: newRoomPassword,
                        created_by: user.id,
                        expires_at: expiresAt.toISOString(),
                    },
                ])
                .select("id")
                .single();

            if (error) throw error;

            // ルーム作成後に参加
            await joinRoom(data.id);

            // フォームを閉じてリセット
            setShowCreateModal(false);
            setNewRoomName("");
            setNewRoomPassword("");

            // 作成後にルームページへ遷移
            router.push(`/room/${data.id}`);
        } catch (err: any) {
            console.error(err);
            setCreateError(err.message || "ルーム作成に失敗しました");
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={() => setShowCreateModal(true)}
            >
                ルーム作成
            </button>
            {/* ルーム作成モーダル */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="bg-white p-6 rounded shadow-lg w-80"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl mb-4 font-bold">ルーム作成</h2>
                        <input
                            type="text"
                            placeholder="ルーム名"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <input
                            type="password"
                            maxLength={4}
                            placeholder="4桁の数字パスワード"
                            value={newRoomPassword}
                            onChange={(e) => {
                                if (/^\d{0,4}$/.test(e.target.value)) {
                                    setNewRoomPassword(e.target.value);
                                }
                            }}
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        {createError && (
                            <div className="text-red-600 text-sm mb-2">
                                {createError}
                            </div>
                        )}
                        <button
                            className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
                            disabled={
                                !newRoomName.trim() ||
                                newRoomPassword.length !== 4 ||
                                creating
                            }
                            onClick={handleCreateRoom}
                        >
                            {creating ? "作成中..." : "ルーム作成"}
                        </button>
                        <button
                            className="mt-2 w-full text-center text-gray-600 underline"
                            onClick={() => setShowCreateModal(false)}
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
