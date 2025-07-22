// import TablePage from "./page";
// import { cookies } from "next/headers";
// import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// export default async function TablePageWrapper({
//   params,
// }: {
//   params: { code: string; tableId: string };
// }) {
//   const supabase = createServerComponentClient({ cookies });

//   // 卓データ取得
//   const { data: table, error: tableError } = await supabase
//     .from("tables")
//     .select("*, players(*, users(*))")
//     .eq("id", params.tableId)
//     .single();

//   // ログインユーザー取得
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   console.log("supabase user", user);

//   // スコア履歴・ボーナス等も必要に応じて取得
//   // ここではダミー
//   const scoreHistory = {};
//   const bonus = {};

//   if (!table || !user) {
//     return <div>データ取得エラー</div>;
//   }

//   // TablePlayer型に整形
//   const players = (table.players || []).map((p: any) => ({
//     id: p.id,
//     user_id: p.user_id,
//     position: p.position,
//     seat_order: p.seat_order,
//     current_score: p.current_score,
//     users: p.users,
//   }));

//   return (
//     <TablePage
//       initialPlayers={players}
//       initialScoreHistory={scoreHistory}
//       initialBonus={bonus}
//       initialGameNumber={1}
//       initialTableStatus={table.status as any}
//       currentUser={{
//         id: user.id ?? "",
//         name: user.user_metadata?.name ?? "",
//         email: user.email ?? "",
//       }}
//       tableName={table.name}
//     />
//   );
// }
