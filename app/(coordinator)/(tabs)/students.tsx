import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import AppSelect from "@/components/common/AppSelect";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import StudentsList from "@/components/students/StudentsList";
import { Colors } from "@/constants/colors";
import { ALL_CLASSES, useCoordinatorGrade } from "@/hooks/useCoordinatorGrade";
import { getStudents } from "@/services/student.service";

export default function CoordinatorStudentsScreen() {
    const { gradeId, gradeName, divisionOptions, loading: gradeLoading, error: gradeError, load: loadGrade } = useCoordinatorGrade();

    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentsError, setStudentsError] = useState(false);
    const [search, setSearch] = useState("");
    const searchRef = useRef(""); // mirrors `search` without changing fetchStudents' identity

    const [selectedDivisionId, setSelectedDivisionId] = useState<string>(ALL_CLASSES);

    const filterByText = useCallback((all: any[], text: string) => {
        if (!text.trim()) return all;
        const lower = text.toLowerCase();
        return all.filter(
            (s) => s.name?.toLowerCase().includes(lower) || s.admission_no?.toLowerCase().includes(lower),
        );
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadGrade();
        }, [loadGrade]),
    );

    // Scoped server-side to the coordinator's grade — re-fetches whenever the
    // class filter changes, matching the Class Students screen's fetch shape
    // (getStudents with grade/division ids, one big page, client-side search).
    const fetchStudents = useCallback(async () => {
        if (!gradeId) return;
        try {
            setStudentsLoading(true);
            setStudentsError(false);

            const { data, error } = await getStudents({
                gradeId,
                divisionId: selectedDivisionId !== ALL_CLASSES ? selectedDivisionId : undefined,
                limit: 500,
            });
            if (error) { setStudentsError(true); return; }

            setStudents(data ?? []);
            setFiltered(filterByText(data ?? [], searchRef.current));
        } catch {
            setStudentsError(true);
        } finally {
            setStudentsLoading(false);
        }
    }, [gradeId, selectedDivisionId, filterByText]);

    useFocusEffect(
        useCallback(() => {
            if (gradeId) fetchStudents();
        }, [gradeId, fetchStudents]),
    );

    const handleSearch = (text: string) => {
        setSearch(text);
        searchRef.current = text;
        setFiltered(filterByText(students, text));
    };

    const loading = gradeLoading || studentsLoading;
    const error = gradeError || studentsError;

    if (loading) {
        return <LoadingState title="Loading Students" subtitle="Fetching students in your grade..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch students. Please try again."
                onRetry={() => { loadGrade(); fetchStudents(); }}
            />
        );
    }

    return (
        <ScreenWrapper>
            {/* Header — no back chevron, this is a primary tab now */}
            <PageHeader
                title="Students"
                subtitle={gradeName ? `Grade ${gradeName} · ${students.length} students` : `${students.length} students`}
            />

            {/* Class Filter */}
            <View style={{ zIndex: 10 }}>
                <AppSelect
                    label="Class"
                    iconName="funnel-outline"
                    value={selectedDivisionId}
                    options={divisionOptions}
                    searchable={false}
                    onChange={(v) => setSelectedDivisionId(String(v))}
                />
            </View>

            {/* Search Bar */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.card,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: Colors.inputBorder,
                    paddingHorizontal: 14,
                    minHeight: 48,
                    marginBottom: 16,
                }}
            >
                <Ionicons name="search" size={18} color={Colors.iconDefault} style={{ marginRight: 10 }} />
                <TextInput
                    value={search}
                    onChangeText={handleSearch}
                    placeholder="Search by name or admission number..."
                    placeholderTextColor={Colors.textMuted}
                    style={{ flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 10 }}
                />
                {search.length > 0 && (
                    <Pressable onPress={() => handleSearch("")} hitSlop={8} accessibilityLabel="Clear search">
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </Pressable>
                )}
            </View>

            {/* Student List */}
            <StudentsList
                students={filtered}
                loading={loading}
                onStudentPress={(student) =>
                    router.push({
                        pathname: "/(coordinator)/students/[id]",
                        params: { id: student.id },
                    })
                }
                ListEmptyComponent={
                    <EmptyState
                        title={search.trim() ? "No Results" : "No Students Yet"}
                        subtitle={
                            search.trim()
                                ? `No students match "${search}"`
                                : "No students assigned to your grade yet."
                        }
                        icon="school-outline"
                        iconColor={Colors.primary}
                        iconBgColor={Colors.primaryLight}
                    />
                }
            />
        </ScreenWrapper>
    );
}
