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
        // 1. Restore any persisted session from AsyncStorage on app start
        restoreSession();

        // 2. Subscribe to live auth events (expiry, refresh, remote sign-out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_OUT" || !session) {
                    // Token expired or user signed out from another device
                    dispatch(clearUser());
                    router.replace("/(auth)/login");
                    return;
                }

                if (event === "TOKEN_REFRESHED" && session) {
                    // Token was silently refreshed — re-hydrate Redux user profile
                    // in case it was cleared (e.g. app backgrounded for a long time)
                    const { data: profile, error } = await supabase
                        .from("users")
                        .select("*")
                        .eq("auth_id", session.user.id)
                        .single();

                    if (!error && profile) {
                        dispatch(setUser({ user: profile, role: profile.role }));
                    }
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
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