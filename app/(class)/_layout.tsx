import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// CLASS-only route group. Consistent with AdminLayout/TeacherLayout:
// reads role from Redux (already populated by useSessionRestore before
// any redirect) instead of a fresh Supabase call on every screen mount.
// Uses <Stack> so router.push() works properly for sub-routes.
export default function ClassLayout() {
    const role = useAppSelector((state) => state.auth.role);

    if (!role || role !== "CLASS") {
        return <Redirect href="/(auth)/role-select" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
