import {
    useEffect,
    useState,
} from "react";

import { supabase } from "../lib/supabase";

export default function useCurrentUser() {
    const [loading, setLoading] =
        useState(true);

    const [profile, setProfile] =
        useState<any>(null);

    const fetchUser =
        async () => {
            try {
                const {
                    data: sessionData,
                } =
                    await supabase.auth.getSession();

                const authUser =
                    sessionData?.session?.user;

                if (!authUser) {
                    setProfile(null);

                    return;
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

                setProfile(data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchUser();
    }, []);

    return {
        profile,
        loading,
    };
}