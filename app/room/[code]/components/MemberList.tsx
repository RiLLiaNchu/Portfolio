import React from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface RoomMember {
  id: string;
  user_id: string;
  users: User;
  joined_at: string;
}

interface MemberListProps {
  members: RoomMember[];
}

export default function MemberList({ members }: MemberListProps) {
  if (!members.length)
    return (
      <div className="p-4 border rounded bg-gray-50">参加者がまだいません</div>
    );

  return (
    <div className="p-4 border rounded bg-white shadow-sm max-h-[480px] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-3">
        参加メンバー ({members.length})
      </h2>
      <ul className="space-y-2">
        {members.map(({ id, users, joined_at }) => (
          <li key={id} className="flex flex-col border-b pb-2 last:border-none">
            <div className="font-medium">{users.name || "名前なし"}</div>
            <div className="text-sm text-gray-600">{users.email}</div>
            <div className="text-xs text-gray-400">
              入室日時: {new Date(joined_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
