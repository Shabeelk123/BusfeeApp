import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import AppButton from "@/components/common/AppButton";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import StudentsList from "@/components/students/StudentsList";
import { Colors, Shadows } from "@/constants/colors";
import { getCurrentUserProfile } from "@/services/auth.service";
import { getTeacherStudents } from "@/services/student.service";

export default function TeacherStudentsScreen() {
    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const profile = await getCurrentUserProfile();
            if (!profile) return;
            const { data, error } = await getTeacherStudents(profile.assigned_class);
            if (error) { console.log(error); return; }
            if (data) { setStudents(data); setFiltered(data); }
        } catch (error) {
            console.log(error);
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
                    s.full_name?.toLowerCase().includes(lower) ||
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

    return (
        <ScreenWrapper>
            {/* Header */}
            <PageHeader
                title="My Students"
                subtitle={`${students.length} in your class`}
                showBack
                action={
                    <AppButton
                        label="+ Add"
                        onPress={() => router.push("/(teacher)/students/create")}
                        size="sm"
                        variant="primary"
                    />
                }
            />

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
                <Ionicons
                    name="search"
                    size={18}
                    color={Colors.iconDefault}
                    style={{ marginRight: 10 }}
                />
                <TextInput
                    value={search}
                    onChangeText={handleSearch}
                    placeholder="Search by name or admission number..."
                    placeholderTextColor={Colors.textMuted}
                    style={{
                        flex: 1,
                        fontSize: 15,
                        color: Colors.textPrimary,
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
                            color={Colors.textMuted}
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
                        pathname: "/(teacher)/students/[id]",
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
                        iconColor={Colors.primary}
                        iconBgColor={Colors.primaryLight}
                    />
                }
            />
        </ScreenWrapper>
    );
}