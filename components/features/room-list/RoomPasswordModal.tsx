import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RoomWithAuthor } from "@/types/room";
import { supabase } from "@/lib/supabase";
import { joinRoom } from "@/lib/api/rooms";

type Props = {
    room: RoomWithAuthor;
    isOpen: boolean;
    onClose: () => void;
};

export const RoomPasswordModal: React.FC<Props> = ({
    room,
    isOpen,
    onClose,
}) => {
    const router = useRouter();
    const [passwordInput, setPasswordInput] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        setLoading(true);
        setError("");

        try {
            await joinRoom(room.id, passwordInput);
            router.push(`/room/${room.id}`);
            onClose();
        } catch (err: any) {
            setError(err.message || "エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose}
        >
            <div
                className="bg-white p-6 rounded shadow-lg w-80"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl mb-4 font-bold">{room.name} に入室</h2>
                <input
                    type="password"
                    maxLength={4}
                    placeholder="4桁のパスワード"
                    value={passwordInput}
                    onChange={(e) => {
                        if (/^\d{0,4}$/.test(e.target.value)) {
                            setPasswordInput(e.target.value);
                            setError(""); // 入力中にエラーを消す
                        }
                    }}
                    className="w-full p-2 mb-4 border rounded"
                />

                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                <button
                    className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
                    disabled={passwordInput.length !== 4}
                    onClick={handleJoin}
                >
                    {loading ? "確認中..." : "入室する"}
                </button>

                <button
                    className="mt-2 w-full text-center text-gray-600 underline"
                    onClick={onClose}
                >
                    キャンセル
                </button>
            </div>
        </div>
    );
};
