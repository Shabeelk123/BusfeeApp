import { supabase } from "../lib/supabase";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginUser = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const logoutUser = async () => {
    return await supabase.auth.signOut();
};

// ─── Profile lookup ───────────────────────────────────────────────────────────

/**
 * Fetch the users profile for the currently signed-in auth user.
 * V2: users.id = auth.uid() — no auth_id column.
 */
export const getCurrentUserProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    if (!authUser) return null;

    const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)   // V2: PK = auth UID
        .single();

    return data;
};