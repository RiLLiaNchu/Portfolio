"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// 順位点テンプレート（必要なら外部importでもOK）
const RANK_POINT_TEMPLATES = {
  "10-30": {
    sanma: { first: 30000, second: 10000, third: -10000 },
    yonma: { first: 30000, second: 10000, third: -10000, fourth: -30000 },
  },
};

interface TableSettings {
  name: string;
  gameType: "sanma" | "yonma";
  rankPoints: {
    first: number;
    second: number;
    third: number;
    fourth?: number;
  };
  startingPoints: number;
  returnPoints: number;
  scoreCalculation: {
    method: string;
  };
}

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomCode: string;
}

export default function CreateTableDialog({
  open,
  onOpenChange,
  roomId,
  roomCode,
}: CreateTableDialogProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [tableSettings, setTableSettings] = useState<TableSettings>({
    name: "",
    gameType: "yonma",
    rankPoints: RANK_POINT_TEMPLATES["10-30"].yonma,
    startingPoints: 25000,
    returnPoints: 30000,
    scoreCalculation: { method: "round56" },
  });

  const validateRankPoints = (tableSettings: TableSettings) => {
    const { first, second, third, fourth } = tableSettings.rankPoints;
    const total =
      tableSettings.gameType === "yonma"
        ? first + second + third + (fourth || 0)
        : first + second + third;

    return total === 0;
  };

  const getRankPointsError = (tableSettings: TableSettings) => {
    const { first, second, third, fourth } = tableSettings.rankPoints;
    const total =
      tableSettings.gameType === "yonma"
        ? first + second + third + (fourth || 0)
        : first + second + third;

    if (total !== 0) {
      return `順位点の合計が${total.toLocaleString()}点です。合計は0点になるように設定してください。`;
    }
    return null;
  };

  const createNewTable = async () => {
    if (!tableSettings.name.trim()) {
      alert("卓名を入力してください");
      return;
    }

    if (!validateRankPoints(tableSettings)) {
      alert(getRankPointsError(tableSettings));
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase
        .from("tables")
        .insert({
          room_id: roomId,
          name: tableSettings.name,
          status: "waiting",
          settings: JSON.stringify(tableSettings),
        })
        .select()
        .single();

      if (error) throw error;

      onOpenChange(false);
      router.push(`/room/${roomCode}/table/${data.id}`);
    } catch (e: any) {
      alert(e.message || "卓の作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            新しい卓を作成
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* 卓名入力 */}
        <div className="space-y-6">
          <div>
            <Label htmlFor="table-name">卓名</Label>
            <Input
              id="table-name"
              value={tableSettings.name}
              onChange={(e) =>
                setTableSettings((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="卓名を入力"
              className="mt-1"
            />
          </div>

          {/* 三麻・四麻選択 */}
          <div>
            <Label>種別</Label>
            <RadioGroup
              className="flex gap-4 mt-1"
              value={tableSettings.gameType}
              onValueChange={(v) => {
                const newType = v as "sanma" | "yonma";
                setTableSettings((prev) => ({
                  ...prev,
                  gameType: newType,
                  rankPoints:
                    newType === "sanma"
                      ? RANK_POINT_TEMPLATES["10-30"].sanma
                      : RANK_POINT_TEMPLATES["10-30"].yonma,
                }));
              }}
            >
              <RadioGroupItem value="yonma" id="yonma" />
              <Label htmlFor="yonma" className="mr-4">
                四麻
              </Label>
              <RadioGroupItem value="sanma" id="sanma" />
              <Label htmlFor="sanma">三麻</Label>
            </RadioGroup>
          </div>

          {/* 順位点入力 */}
          <div>
            <Label>順位点（合計0点になるように）</Label>
            <div className="flex gap-2 mt-1">
              <div>
                <Label htmlFor="first">1位</Label>
                <Input
                  id="first"
                  type="number"
                  value={tableSettings.rankPoints.first}
                  onChange={(e) =>
                    setTableSettings((prev) => ({
                      ...prev,
                      rankPoints: {
                        ...prev.rankPoints,
                        first: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-20"
                />
              </div>
              <div>
                <Label htmlFor="second">2位</Label>
                <Input
                  id="second"
                  type="number"
                  value={tableSettings.rankPoints.second}
                  onChange={(e) =>
                    setTableSettings((prev) => ({
                      ...prev,
                      rankPoints: {
                        ...prev.rankPoints,
                        second: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-20"
                />
              </div>
              <div>
                <Label htmlFor="third">3位</Label>
                <Input
                  id="third"
                  type="number"
                  value={tableSettings.rankPoints.third}
                  onChange={(e) =>
                    setTableSettings((prev) => ({
                      ...prev,
                      rankPoints: {
                        ...prev.rankPoints,
                        third: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-20"
                />
              </div>
              {tableSettings.gameType === "yonma" && (
                <div>
                  <Label htmlFor="fourth">4位</Label>
                  <Input
                    id="fourth"
                    type="number"
                    value={tableSettings.rankPoints.fourth ?? 0}
                    onChange={(e) =>
                      setTableSettings((prev) => ({
                        ...prev,
                        rankPoints: {
                          ...prev.rankPoints,
                          fourth: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-20"
                  />
                </div>
              )}
            </div>
            {!validateRankPoints(tableSettings) && (
              <div className="text-red-600 text-sm mt-1">
                {getRankPointsError(tableSettings)}
              </div>
            )}
          </div>

          {/* 持ち点・返し点 */}
          <div className="flex gap-4">
            <div>
              <Label htmlFor="startingPoints">持ち点</Label>
              <Input
                id="startingPoints"
                type="number"
                value={tableSettings.startingPoints}
                onChange={(e) =>
                  setTableSettings((prev) => ({
                    ...prev,
                    startingPoints: Number(e.target.value),
                  }))
                }
                className="w-28"
              />
            </div>
            <div>
              <Label htmlFor="returnPoints">返し点</Label>
              <Input
                id="returnPoints"
                type="number"
                value={tableSettings.returnPoints}
                onChange={(e) =>
                  setTableSettings((prev) => ({
                    ...prev,
                    returnPoints: Number(e.target.value),
                  }))
                }
                className="w-28"
              />
            </div>
          </div>

          {/* 計算方法選択 */}
          <div>
            <Label>計算方法</Label>
            <Select
              value={tableSettings.scoreCalculation.method}
              onValueChange={(method) =>
                setTableSettings((prev) => ({
                  ...prev,
                  scoreCalculation: { method },
                }))
              }
            >
              <SelectTrigger className="w-60 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="decimal">小数点第一位まで表示</SelectItem>
                <SelectItem value="round">四捨五入</SelectItem>
                <SelectItem value="round56">五捨六入</SelectItem>
                <SelectItem value="ceil">切り上げ</SelectItem>
                <SelectItem value="floor">切り捨て</SelectItem>
                <SelectItem value="plusminus">
                  プラスマイナスで分ける
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 作成ボタン */}
          <div className="mt-6 flex justify-end">
            <Button onClick={createNewTable} disabled={creating}>
              {creating ? "作成中..." : "作成する"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
