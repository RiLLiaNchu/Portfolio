export type Room = {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
    expires_at: string | null; // null 許容ならこうする
    password: string;
};

export type PublicRoom = Omit<Room, "password">;

export type RoomWithAuthor = PublicRoom & {
    created_by_name: string;
};
