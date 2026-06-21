import {
    Redirect,
    Slot,
} from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// Reads from Redux (already populated by useSessionRestore at app start).
// Consistent with TeacherLayout — no extra Supabase call on every mount.
export default function AdminLayout() {
    const role = useAppSelector((state) => state.auth.role);

    if (!role || role !== "ADMIN") {
        return <Redirect href="/(auth)/login" />;
    }

    return <Slot />;
}