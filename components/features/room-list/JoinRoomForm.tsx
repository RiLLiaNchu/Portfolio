// 参加フォーム

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type JoinRoomFormProps = {
    roomCode: string;
    setRoomCode: (val: string) => void;
    onJoin: (e: React.FormEvent) => void;
    loading: boolean;
    error?: string;
    onOpenCreate: () => void;
};

export const JoinRoomForm = ({
    roomCode,
    setRoomCode,
    onJoin,
    loading,
    error,
    onOpenCreate,
}: JoinRoomFormProps) => {
    return (
        <Card>
            <CardHeader className="text-center">
                <Users className="h-12 w-12 mx-auto text-green-600 mb-2" />
                <CardTitle>ルームに参加</CardTitle>
                <CardDescription>
                    コードを入力するか、下の一覧から選択
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onJoin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="roomCode">ルームコード</Label>
                        <Input
                            id="roomCode"
                            type="text"
                            placeholder="1234"
                            value={roomCode}
                            onChange={(e) =>
                                setRoomCode(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 4)
                                )
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

                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700 py-4"
                            disabled={loading || roomCode.length !== 4}
                        >
                            {loading ? "参加中..." : "ルームに参加"}
                        </Button>
                        <Button
                            type="button"
                            className="w-40"
                            onClick={() => {
                                setRoomCode("");
                                onOpenCreate();
                            }}
                        >
                            ルーム作成
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
