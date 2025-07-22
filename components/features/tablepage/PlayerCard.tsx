// プレイヤーカードコンポーネント
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

type TablePlayer = {
    id: string;
    user_id: string;
    position: string;
    seat_order: number;
    current_score: number;
    users: {
        id: string;
        name: string;
        email: string;
    };
};

export const PlayerCard = ({
    player,
    position,
}: {
    player: TablePlayer;
    position: string;
}) => {
    const isBot = player.users.email.endsWith("@bot.example.com");

    return (
        <div
            className={`bg-white p-3 rounded-lg shadow-md border-2 min-w-[120px] ${
                isBot ? "border-blue-300 bg-blue-50" : "border-green-200"
            }`}
        >
            <div className="text-center">
                <Avatar className="w-12 h-12 mx-auto mb-2">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" />
                    <AvatarFallback
                        className={
                            isBot
                                ? "bg-blue-200 text-blue700"
                                : "bg-green-100 text-green-600"
                        }
                    >
                        {isBot ? "🤖" : player.users.name.slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
                <div className="font-medium text-sm">{player.users.name}</div>
                <div className="text-xs text-gray-600">{position}</div>
                <div className="text-lg font-bold text-green-600 mt-1">
                    {player.current_score.toLocaleString()}
                </div>
                {isBot && (
                    <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded mt-1">
                        BOT
                    </div>
                )}
            </div>
        </div>
    );
};
