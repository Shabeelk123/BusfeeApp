import { supabase } from "../lib/supabase";

export const createTeacher =
    async ({
        name,
        email,
        password,
        assigned_class,
    }: {
        name: string;

        email: string;

        password: string;

        assigned_class: string;
    }) => {
        // Create auth user
        const {
            data,
            error,
        } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error || !data.user) {
            return { error };
        }

        // Create profile
        const {
            error: profileError,
        } = await supabase
            .from("users")
            .insert([
                {
                    auth_id: data.user.id,

                    name,

                    email,

                    role: "TEACHER",

                    assigned_class,
                },
            ]);

        return {
            error: profileError,
        };
    };