import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";

interface TableListProps {
  tables: any[];
  roomCode: string;
  onOpenCreateModal: () => void;
}

export default function TableList({
  tables,
  roomCode,
  onOpenCreateModal,
}: TableListProps) {
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>卓一覧</CardTitle>
        <Button
          onClick={onOpenCreateModal}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-1" /> 卓作成
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {tables.map((table) => {
            let settings = null;
            try {
              settings = table.settings ? JSON.parse(table.settings) : null;
            } catch {
              settings = null;
            }

            return (
              <Card
                key={table.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent>
                  <div className="flex justify-between mb-2 items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{table.name}</h3>
                      {settings && (
                        <Badge variant="outline" className="text-xs">
                          {settings.gameType === "sanma" ? "三麻" : "四麻"}
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant={
                        table.status === "playing" ? "default" : "secondary"
                      }
                    >
                      {table.status === "playing" ? "進行中" : "待機中"}
                    </Badge>
                  </div>
                  {settings && (
                    <div className="text-xs text-gray-600 mb-2 space-y-1">
                      <div>
                        持ち点: {settings.startingPoints?.toLocaleString()}点 /
                        返し点: {settings.returnPoints?.toLocaleString()}点
                      </div>
                      <div>計算方法: {settings.scoreCalculation?.method}</div>
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mb-3">
                    作成: {new Date(table.created_at).toLocaleString("ja-JP")}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-transparent"
                    asChild
                  >
                    <Link href={`/room/${roomCode}/table/${table.id}`}>
                      {table.status === "playing" ? "卓に参加" : "卓を開始"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
