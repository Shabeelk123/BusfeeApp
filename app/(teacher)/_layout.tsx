import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// Uses Redux (already populated by useSessionRestore before any redirect)
// instead of a fresh Supabase call on every screen mount.
// Uses <Stack> so router.push() works properly for sub-routes.
//
// CLASS now has its own /(class) module — this group is kept only as a
// temporary placeholder for COORDINATOR (and legacy TEACHER rows) until
// the Coordinator module is built. See app/(class)/_layout.tsx.
export default function TeacherLayout() {
    const role = useAppSelector((state) => state.auth.role);

    const allowed = role === "COORDINATOR" || role === "TEACHER";

    if (!role || !allowed) {
        return <Redirect href="/(auth)/role-select" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}