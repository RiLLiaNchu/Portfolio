import React from 'react';

interface PlayerScore {
  name: string;
  score: number;
  rank: number;
}

interface LatestMatchInfoProps {
  matchNumber: number; // 例: 5回目
  date: string; // 例: 2025/07/18 15:30
  playerScores: PlayerScore[]; // 例）[{name: 'A', score: 40, rank: 1}, ...]
}

export function LatestMatchInfo({
  matchNumber,
  date,
  playerScores,
}: LatestMatchInfoProps) {
  return (
    <div className="p-4 space-y-1">
      <h3 className="font-semibold">🕒 対局情報（最新）</h3>
      <p>対局回数：第{matchNumber}回</p>
      <p>日時：{date}</p>
      <p>
        スコア・順位など：
        {playerScores.map((p) => (
          <span key={p.name} className="mr-2">
            {p.name}：{p.score >= 0 ? `+${p.score}` : p.score}，{p.rank}位
          </span>
        ))}
      </p>
    </div>
  );
}
