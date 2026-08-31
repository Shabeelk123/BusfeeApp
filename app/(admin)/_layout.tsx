import {
    Redirect,
    Stack,
} from "expo-router";
import { useAppSelector } from "../../hooks/redux";

// Reads from Redux (already populated by useSessionRestore at app start).
// Consistent with ClassLayout/TeacherLayout. Uses <Stack> (not <Slot>) so
// the (tabs) group's screens push properly over full-screen routes like
// students/create, reports/class-wise, grades/*, etc., hiding the tab bar.
export default function AdminLayout() {
    const role = useAppSelector((state) => state.auth.role);

    if (!role || role !== "ADMIN") {
        return <Redirect href="/(auth)/role-select" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}