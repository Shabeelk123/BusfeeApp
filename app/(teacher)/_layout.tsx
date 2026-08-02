import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// Uses Redux (already populated by useSessionRestore before any redirect)
// instead of a fresh Supabase call on every screen mount.
// Uses <Stack> so router.push() works properly for sub-routes.
export default function TeacherLayout() {
    const role = useAppSelector((state) => state.auth.role);

    // Allow V2 roles (CLASS, COORDINATOR) that use this group as a placeholder.
    // TEACHER kept as legacy fallback.
    const allowed = role === "CLASS" || role === "COORDINATOR" || role === "TEACHER";

    if (!role || !allowed) {
        return <Redirect href="/(auth)/role-select" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}