// 空席カードコンポーネント
import { Avatar, AvatarFallback } from "../../ui/avatar";

export const EmptyPlayerCard = ({ position }: { position: string }) => {
    return (
        <div className="bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-300 min-w-[120px]">
            <div className="text-center">
                <Avatar className="w-12 h-12 mx-auto mb-2">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="font-medium text-sm text-gray-500">空席</div>
                <div className="text-xs text-gray-400">{position}</div>
                <div className="text-lg font-bold text-gray-400 mt-1">
                    25,000
                </div>
            </div>
        </div>
    );
};
