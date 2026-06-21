import { Redirect, Slot } from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// Reads from Redux (already populated by useSessionRestore at app start).
// Consistent with AdminLayout and TeacherLayout.
export default function StudentLayout() {
    const role = useAppSelector((state) => state.auth.role);

    if (!role || role !== "STUDENT") {
        return <Redirect href="/(auth)/login" />;
    }

    return <Slot />;
}