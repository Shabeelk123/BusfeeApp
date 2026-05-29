import { useEffect } from "react";

import { router } from "expo-router";

import { supabase } from "../lib/supabase";

import {
    useAppDispatch,
} from "./redux";

import {
    clearUser,
    setUser,
} from "../store/authSlice";

export const useSessionRestore = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                dispatch(clearUser());

                router.replace("/(auth)/login");

                return;
            }

            const authUser = session.user;

            const {
                data: profile,
                error,
            } = await supabase
                .from("users")
                .select("*")
                .eq("auth_id", authUser.id)
                .single();

            if (error || !profile) {
                dispatch(clearUser());

                router.replace("/(auth)/login");

                return;
            }

            dispatch(
                setUser({
                    user: profile,
                    role: profile.role,
                })
            );

            switch (profile.role) {
                case "ADMIN":
                    router.replace(
                        "/(admin)/dashboard"
                    );
                    break;

                case "TEACHER":
                    router.replace(
                        "/(teacher)/dashboard"
                    );
                    break;

                case "STUDENT":
                    router.replace(
                        "/(student)/dashboard"
                    );
                    break;

                default:
                    router.replace("/(auth)/login");
            }
        } catch (error) {
            dispatch(clearUser());

            router.replace("/(auth)/login");
        }
    };
};