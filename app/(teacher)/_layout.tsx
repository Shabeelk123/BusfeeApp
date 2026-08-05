import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// Uses Redux (already populated by useSessionRestore before any redirect)
// instead of a fresh Supabase call on every screen mount.
// Uses <Stack> so router.push() works properly for sub-routes.
//
// CLASS has its own /(class) module and COORDINATOR now has its own
// /(coordinator) module (see app/(coordinator)/_layout.tsx) — this group is
// kept only for legacy TEACHER rows (role removed in V2, no new accounts).
export default function TeacherLayout() {
    const role = useAppSelector((state) => state.auth.role);

    if (!role || role !== "TEACHER") {
        return <Redirect href="/(auth)/role-select" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}