import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// COORDINATOR-only route group. Consistent with AdminLayout/ClassLayout:
// reads role from Redux (already populated by useSessionRestore before
// any redirect) instead of a fresh Supabase call on every screen mount.
// Uses <Stack> so router.push() works properly for sub-routes.
export default function CoordinatorLayout() {
    const role = useAppSelector((state) => state.auth.role);

    if (!role || role !== "COORDINATOR") {
        return <Redirect href="/(auth)/role-select" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
