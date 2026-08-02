import { supabase } from "../lib/supabase";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginUser = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const logoutUser = async () => {
    return await supabase.auth.signOut();
};

export const getCurrentSession = async () => {
    return await supabase.auth.getSession();
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

/**
 * Fetch just the role for a given Supabase Auth UID.
 * Used by useSessionRestore for role-based routing.
 */
export const getUserRole = async (
    authId: string
): Promise<{ role: string | null; error: any }> => {
    const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", authId)        // V2: PK = auth UID
        .single();

    return { role: data?.role ?? null, error };
};