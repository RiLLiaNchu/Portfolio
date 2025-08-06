// ScoreTable.tsx
import React from 'react';

interface ScoreTableProps {
  headers: string[]; // 例：['A', 'B', 'C', 'D']
  rows: {
    label: string; // 例：合計、和了、放銃
    values: number[]; // 各プレイヤーの値。配列の長さはheadersと同じ
  }[];
}

export function ScoreTable({ headers, rows }: ScoreTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border px-2 py-1">項目</th>
            {headers.map((h) => (
              <th key={h} className="border px-2 py-1">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="border px-2 py-1">{row.label}</td>
              {row.values.map((val, i) => (
                <td key={i} className="border px-2 py-1">
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
