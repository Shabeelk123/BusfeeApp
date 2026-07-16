import { useEffect } from "react";

import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { supabase } from "../lib/supabase";

import { useAppDispatch } from "./redux";

import { clearUser, setUser } from "../store/authSlice";

/** Fetch the user profile row from the DB */
const fetchProfile = async (authId: string) => {
    const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .single();

    return { profile, error };
};

/** Navigate to the correct dashboard based on role */
const navigateByRole = (role: string) => {
    switch (role) {
        case "ADMIN":
            router.replace("/(admin)/dashboard");
            break;
        case "TEACHER":
            router.replace("/(teacher)/dashboard");
            break;
        case "STUDENT":
            router.replace("/(student)/dashboard");
            break;
        default:
            router.replace("/(auth)/role-select");
    }
};

/**
 * Returns true if the error is a stale/revoked refresh token error.
 * Supabase throws `AuthApiError` with status 400 and message containing
 * "Invalid Refresh Token" or "Refresh Token Not Found" when a previously
 * persisted token has been revoked or purged server-side.
 */
const isInvalidRefreshTokenError = (err: unknown): boolean => {
    if (!err || typeof err !== "object") return false;
    const msg = (err as any)?.message ?? "";
    return (
        msg.includes("Invalid Refresh Token") ||
        msg.includes("Refresh Token Not Found")
    );
};

export const useSessionRestore = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        let isMounted = true;

        const clearAndRedirect = async () => {
            // Force-sign-out purges the bad token from AsyncStorage so the
            // error does not repeat on the next app launch.
            try { await supabase.auth.signOut(); } catch { /* ignore */ }
            dispatch(clearUser());
            if (isMounted) router.replace("/(auth)/role-select");
        };

        const restoreSession = async () => {
            try {
                // Read the cached session from AsyncStorage.
                // If the stored refresh token is invalid/revoked, Supabase will
                // throw an AuthApiError here instead of returning null.
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                // Handle invalid/revoked refresh token explicitly.
                // Without this, the bad token stays in AsyncStorage and the
                // error repeats on every app launch.
                if (sessionError) {
                    console.warn("[SessionRestore] getSession error:", sessionError.message);
                    await clearAndRedirect();
                    return;
                }

                if (!isMounted) return;

                if (!session) {
                    dispatch(clearUser());
                    router.replace("/(auth)/role-select");
                    return;
                }

                // Fetch user profile from DB
                const { profile, error: profileError } = await fetchProfile(
                    session.user.id
                );

                if (!isMounted) return;

                if (profileError || !profile) {
                    dispatch(clearUser());
                    router.replace("/(auth)/role-select");
                    return;
                }

                dispatch(setUser({ user: profile, role: profile.role }));
                navigateByRole(profile.role);
            } catch (err: unknown) {
                console.warn("[SessionRestore] Unexpected error:", err);

                if (isInvalidRefreshTokenError(err)) {
                    // Bad token in AsyncStorage — purge it so next launch is clean
                    await clearAndRedirect();
                } else {
                    if (!isMounted) return;
                    dispatch(clearUser());
                    router.replace("/(auth)/role-select");
                }
            } finally {
                // Always hide the native splash once we know where to go.
                await SplashScreen.hideAsync();
            }
        };

        // 1. Restore session on mount
        restoreSession();

        // 2. Subscribe to live auth events (token expiry, remote sign-out, refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            // TOKEN_REFRESH_FAILED fires when autoRefreshToken fails due to
            // a revoked/invalid refresh token while the app is in foreground.
            if (
                event === "SIGNED_OUT" ||
                event === ("TOKEN_REFRESH_FAILED" as any) ||
                !session
            ) {
                // Purge bad token and send user back to role selection
                await clearAndRedirect();
                return;
            }

            if (event === "TOKEN_REFRESHED" && session) {
                // Re-hydrate Redux in case the app was backgrounded a long time
                const { profile, error } = await fetchProfile(session.user.id);
                if (!error && profile) {
                    dispatch(setUser({ user: profile, role: profile.role }));
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);
};