import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import StudentsList from "@/components/students/StudentsList";
import { getCurrentClassAccount } from "@/services/account.service";
import { getStudents } from "@/services/student.service";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background: "#f7fafc",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
} as const;

export default function ClassStudentsScreen() {
    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [classLabel, setClassLabel] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);

            const { data: account, error: accountError } = await getCurrentClassAccount();
            if (accountError || !account) { setError(true); return; }

            setClassLabel(`${account.grade.name}-${account.division.name}`);

            const { data, error } = await getStudents({
                gradeId: account.grade_id,
                divisionId: account.division_id,
                limit: 500,
            });
            if (error) { setError(true); return; }

            setStudents(data ?? []);
            setFiltered(data ?? []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchStudents();
        }, [fetchStudents]),
    );

    const handleSearch = (text: string) => {
        setSearch(text);
        if (!text.trim()) { setFiltered(students); return; }
        const lower = text.toLowerCase();
        setFiltered(
            students.filter(
                (s) =>
                    s.name?.toLowerCase().includes(lower) ||
                    s.admission_no?.toLowerCase().includes(lower),
            ),
        );
    };

    if (loading) {
        return (
            <LoadingState
                title="Loading Students"
                subtitle="Fetching your class students..."
            />
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch your class students. Please try again."
                onRetry={fetchStudents}
            />
        );
    }

    return (
        <ScreenWrapper backgroundColor={T.background}>
            {/* Header — no back chevron, this is a primary tab now */}
            <PageHeader
                title="My Students"
                subtitle={classLabel ? `Class ${classLabel} · ${students.length} students` : `${students.length} students`}
            />

            {/* Search Bar */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: T.outline,
                    paddingHorizontal: 14,
                    minHeight: 48,
                    marginBottom: 16,
                }}
            >
                <Ionicons
                    name="search"
                    size={18}
                    color={T.onSurfaceVariant}
                    style={{ marginRight: 10 }}
                />
                <TextInput
                    value={search}
                    onChangeText={handleSearch}
                    placeholder="Search by name or admission number..."
                    placeholderTextColor={T.onSurfaceVariant}
                    style={{
                        flex: 1,
                        fontSize: 15,
                        color: T.onSurface,
                        paddingVertical: 10,
                    }}
                />
                {search.length > 0 && (
                    <Pressable
                        onPress={() => handleSearch("")}
                        hitSlop={8}
                        accessibilityLabel="Clear search"
                    >
                        <Ionicons
                            name="close-circle"
                            size={18}
                            color={T.onSurfaceVariant}
                        />
                    </Pressable>
                )}
            </View>

            {/* Student List */}
            <StudentsList
                students={filtered}
                loading={loading}
                onStudentPress={(student) =>
                    router.push({
                        pathname: "/(class)/students/[id]",
                        params: { id: student.id },
                    })
                }
                ListEmptyComponent={
                    <EmptyState
                        title={search.trim() ? "No Results" : "No Students Yet"}
                        subtitle={
                            search.trim()
                                ? `No students match "${search}"`
                                : "No students assigned to your class yet."
                        }
                        icon="school-outline"
                        iconColor={T.navy}
                        iconBgColor={T.navyLight}
                    />
                }
            />
        </ScreenWrapper>
    );
}
