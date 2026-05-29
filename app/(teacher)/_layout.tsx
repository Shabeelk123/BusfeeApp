import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// Uses Redux (already populated by useSessionRestore before any redirect)
// instead of a fresh Supabase call on every screen mount.
// Uses <Stack> so router.push() works properly for sub-routes.
export default function TeacherLayout() {
    const role = useAppSelector((state) => state.auth.role);

    if (!role || role !== "TEACHER") {
        return <Redirect href="/(auth)/login" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}