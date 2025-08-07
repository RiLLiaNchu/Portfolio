"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const LogoutButton: React.FC<{ onAfterLogout?: () => void }> = ({
    onAfterLogout,
}) => {
    const router = useRouter();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("ログアウト失敗", error.message);
        } else {
            onAfterLogout?.();
            router.push("/login"); // ログアウト後の遷移先
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left w-full"
            role="menuitem"
        >
            ログアウト
        </button>
    );
};

export { LogoutButton };
