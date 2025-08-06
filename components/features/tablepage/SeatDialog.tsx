import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TablePlayer } from "@/types/table";

export default function SeatDialog({
    open,
    onClose,
    position,
    player,
    onSit,
    onLeave,
    onAddBot,
    onForceLeave,
    loading,
    players,
    currentUserId,
    canForceLeave = false,
}: {
    open: boolean;
    onClose: () => void;
    position: string | null;
    player: TablePlayer | null;
    onSit: () => void; // 着席（TablePage 側で INSERT or UPDATE を判断）
    onLeave: () => void; // 自分の退席（確認あり）
    onAddBot?: (pos: string) => void; // 空席に BOT を追加するハンドラ
    onForceLeave?: (targetUserId: string) => void; // 他人を強制退席させるハンドラ
    loading?: boolean;
    players: TablePlayer[];
    currentUserId?: string | null;
    canForceLeave?: boolean; // true のときのみ強制退席ボタンを表示
}) {
    // 確認モード: none | leave | force
    const [confirmMode, setConfirmMode] = useState<"none" | "leave" | "force">(
        "none"
    );

    // occupied 判定
    const occupiedPlayer =
        player ?? players.find((pl) => pl.position === position) ?? null;
    const isEmpty = !occupiedPlayer;
    const isMySeat = occupiedPlayer
        ? occupiedPlayer.user_id === currentUserId
        : false;

    const handleConfirmLeave = () => {
        setConfirmMode("leave");
    };
    const handleConfirmForce = () => {
        setConfirmMode("force");
    };

    const cancelConfirm = () => setConfirmMode("none");

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEmpty ? `${position} に着席` : `${position} の席`}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {isEmpty ? (
                        <>
                            <div>この席に着席しますか？</div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={onSit} disabled={loading}>
                                    着席
                                </Button>

                                {/* BOT追加は任意のハンドラを渡す想定 */}
                                {onAddBot && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            position && onAddBot(position)
                                        }
                                        disabled={loading}
                                    >
                                        BOTをここに追加
                                    </Button>
                                )}

                                <Button variant="ghost" onClick={onClose}>
                                    キャンセル
                                </Button>
                            </div>
                        </>
                    ) : isMySeat ? (
                        <>
                            <div className="text-sm">
                                現在の席:{" "}
                                {occupiedPlayer.users?.name ?? "名無し"}
                            </div>

                            {/* 確認モード */}
                            {confirmMode === "leave" ? (
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-600">
                                        退席してもよいですか？操作は取り消せません。
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            onClick={onLeave}
                                            disabled={loading}
                                        >
                                            はい、退席する
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={cancelConfirm}
                                            disabled={loading}
                                        >
                                            キャンセル
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <Button
                                        variant="destructive"
                                        onClick={handleConfirmLeave}
                                        disabled={loading}
                                    >
                                        退席する
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-sm text-gray-500">
                                この席は埋まっています
                            </div>

                            {/* 強制退席は権限がある場合のみ */}
                            {canForceLeave && onForceLeave && (
                                <div className="pt-2">
                                    {confirmMode === "force" ? (
                                        <div className="space-y-2">
                                            <div className="text-sm text-gray-600">本当にこのプレイヤーを退席させますか？</div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => {
                                                        // occupant が確実に存在する前提
                                                        if (occupiedPlayer) onForceLeave(occupiedPlayer.user_id);
                                                    }}
                                                    disabled={loading}
                                                    >
                                                        はい、強制退場させる
                                                    </Button>
                                                    <Button variant="outline" onClick={cancelConfirm} disabled={loading}>
                                                        キャンセル
                                                    </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button variant="destructive" onClick={handleConfirmForce} disabled={loading}>
                                            この人を退席させる
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="pt-2">
                                <Button variant="ghost" onClick={onClose}>
                                    閉じる
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    {/* ここは追加のヘルプや小さい注意書きを入れる場所 */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
