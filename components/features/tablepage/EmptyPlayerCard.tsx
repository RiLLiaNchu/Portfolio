// 空席カードコンポーネント
export const EmptyPlayerCard = ({
    position,
    onClick,
}: {
    position: string;
    onClick?: () => void;
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-white p-3 rounded-lg border-2 border-dashed min-w-[120px] flex items-center justify-center text-sm text-gray-500 hover:bg-gray-50"
        >
            <div className="text-center">
                <div className="font-medium">空席</div>
                <div className="text-xs text-gray-400">{position}</div>
            </div>
        </button>
    );
};
