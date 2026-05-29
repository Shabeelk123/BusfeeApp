import { supabase } from "../lib/supabase";

export const loginUser = async (
    email: string,
    password: string
) => {
    return await supabase.auth.signInWithPassword({
        email,
        password,
    });
};

export const logoutUser = async () => {
    return await supabase.auth.signOut();
};

export const getCurrentSession = async () => {
    return await supabase.auth.getSession();
};

export const getCurrentUserProfile =
    async () => {
        const {
            data: sessionData,
        } =
            await supabase.auth.getSession();

        const authUser =
            sessionData?.session?.user;

        if (!authUser) {
            return null;
        }

        const { data } =
            await supabase
                .from("users")
                .select("*")
                .eq(
                    "auth_id",
                    authUser.id
                )
                .single();

        return data;
    };