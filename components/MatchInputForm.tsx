import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface MatchInput {
  score: number;
  rank: number;
  winCount: number;
  lossCount: number;
}

interface Player {
  user_id: string;
  name: string;
}

interface Props {
  players: Player[];
  initialInput?: Record<string, MatchInput>;
  onSave: (input: Record<string, MatchInput>) => Promise<void>;
  onClose: () => void;
}

export default function MatchInputForm({
  players,
  initialInput,
  onSave,
  onClose,
}: Props) {
  const [input, setInput] = useState<Record<string, MatchInput>>({});

  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
    } else {
      const init: Record<string, MatchInput> = {};
      players.forEach((p) => {
        init[p.user_id] = { score: 0, rank: 0, winCount: 0, lossCount: 0 };
      });
      setInput(init);
    }
  }, [players, initialInput]);

  const handleChange = (
    userId: string,
    field: keyof MatchInput,
    value: number
  ) => {
    setInput((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  const handleSaveClick = async () => {
    await onSave(input);
  };

  return (
    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-auto">
      <h2 className="text-lg font-bold mb-4">📝 対局を記録</h2>
      <table className="w-full border-collapse border border-gray-300 mb-4">
        <thead>
          <tr>
            <th className="border p-2">プレイヤー</th>
            <th className="border p-2">スコア</th>
            <th className="border p-2">順位</th>
            <th className="border p-2">和了</th>
            <th className="border p-2">放銃</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.user_id}>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">
                <input
                  type="number"
                  value={input[p.user_id]?.score ?? 0}
                  onChange={(e) =>
                    handleChange(p.user_id, 'score', Number(e.target.value))
                  }
                  className="w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  value={input[p.user_id]?.rank ?? 0}
                  onChange={(e) =>
                    handleChange(p.user_id, 'rank', Number(e.target.value))
                  }
                  className="w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  value={input[p.user_id]?.winCount ?? 0}
                  onChange={(e) =>
                    handleChange(p.user_id, 'winCount', Number(e.target.value))
                  }
                  className="w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  value={input[p.user_id]?.lossCount ?? 0}
                  onChange={(e) =>
                    handleChange(p.user_id, 'lossCount', Number(e.target.value))
                  }
                  className="w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onClose}>
          閉じる
        </Button>
        <Button onClick={handleSaveClick}>保存</Button>
      </div>
    </div>
  );
}
