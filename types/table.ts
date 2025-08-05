export type UserMin = {
  id: string;
  name: string;
  email: string;
};

export type TablePlayer = {
  id: string;
  user_id: string;
  position: string;
  seat_order: number;
  current_score: number;
  // API 実装によっては users がない場合もあるので optional / nullable にする
  users?: UserMin | null;
};
