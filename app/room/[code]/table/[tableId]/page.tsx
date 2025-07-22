'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { LatestMatchInfo } from '@/components/LatestMatchInfo';
import { ScoreTable } from '@/components/ScoreTable';
import { MatchInputForm } from '@/components/MatchInputForm';

interface Player {
  id: string;
  user_id: string;
  position: string;
  current_score: number;
  name: string;
}

export default function TablePage() {
  const params = useParams();
  const tableId = params.tableId; // URL例: /table/[tableId]
  const [tableName, setTableName] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [showInputForm, setShowInputForm] = useState(false);

  const headers = ['A', 'B', 'C', 'D'];

  const latestMatchNumber = 5;
  const latestMatchDate = '2025/07/18 15:30';
  const latestPlayerScores = [
    { name: 'A', score: 40, rank: 1 },
    { name: 'B', score: 5, rank: 2 },
    { name: 'C', score: -15, rank: 3 },
    { name: 'D', score: -30, rank: 4 },
  ];

  const scoreRows = [
    { label: '合計', values: [40, 5, -15, -30] },
    { label: '和了', values: [3, 2, 1, 0] },
    { label: '放銃', values: [1, 2, 1, 3] },
  ];

  const handleSaveMatch = async () => {
    // 例：matchesテーブルに新しい対局を作成して、match_scoresテーブルに得点・順位を保存する想定
    try {
      // まず新しいmatchレコードを作成
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert([{ table_id: tableId, played_at: new Date().toISOString() }])
        .select()
        .single();
      if (matchError) throw matchError;

      // 次にmatch_scoresにプレイヤー毎のスコア・順位を保存
      const scoresToInsert = players.map((p) => ({
        match_id: matchData.id,
        player_id: p.id,
        score: scores[p.id], // scoresはフォームのstate変数
        rank: ranks[p.id], // ranksも同様
      }));

      const { error: scoresError } = await supabase
        .from('match_scores')
        .insert(scoresToInsert);

      if (scoresError) throw scoresError;

      alert('保存しました！');
      setShowInputForm(false);
      // 必要ならfetchPlayers()などで最新データ再取得も
    } catch (error) {
      console.error(error);
      alert('保存に失敗しました');
    }
  };

  // 卓情報取得
  useEffect(() => {
    if (!tableId) return;

    async function fetchTable() {
      const { data, error } = await supabase
        .from('tables')
        .select('name')
        .eq('id', tableId)
        .single();
      if (error) {
        console.error(error);
        return;
      }
      if (data) setTableName(data.name);
    }
    fetchTable();
  }, [tableId]);

  // 卓のプレイヤー情報取得
  useEffect(() => {
    if (!tableId) return;

    async function fetchPlayers() {
      const { data, error } = await supabase
        .from('table_players')
        .select('id, user_id, position, current_score, users(name)')
        .eq('table_id', tableId);

      console.log('fetchPlayers data:', data);
      console.log('fetchPlayers error:', error);
      if (error) {
        console.error('fetchPlayers error:', JSON.stringify(error, null, 2));
        return;
      }
      if (data) {
        setPlayers(
          data.map((p: any) => ({
            id: p.id,
            user_id: p.user_id,
            position: p.position,
            current_score: p.current_score,
            name: p.users.name,
          }))
        );
      }
    }
    fetchPlayers();
  }, [tableId]);

  return (
    <div>
      {/* JSX内でコンポーネント呼び出し */}
      <LatestMatchInfo
        matchNumber={latestMatchNumber}
        date={latestMatchDate}
        playerScores={latestPlayerScores}
      />

      {/* 対局入力フォームをモーダル表示 */}
      {showInputForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-lg shadow-xl">
            <MatchInputForm
              players={players}
              onClose={() => setShowInputForm(false)}
              onSave={handleSaveMatch}
            />
          </div>
        </div>
      )}

      <ScoreTable headers={headers} rows={scoreRows} />
    </div>
  );
}
