import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import AppButton from "@/components/common/AppButton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { deleteGrade, getGradesWithDivisions } from "@/services/grade.service";
import { Division, Grade } from "@/types/grade";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background: "#f7fafc",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
    danger: "#e53e3e",
    dangerLight: "#fdeaea",
} as const;

type GradeWithDivisions = Grade & { divisions: Division[] };

// ── Grade Card ──────────────────────────────────────────────────────────────
function GradeCard({
    item,
    onDelete,
}: {
    item: GradeWithDivisions;
    onDelete: (grade: GradeWithDivisions) => void;
}) {
    return (
        <View
            style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: T.outline,
                padding: 14,
                marginBottom: 10,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        backgroundColor: T.navyLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                    }}
                >
                    <Text style={{ fontSize: 15, fontWeight: "800", color: T.navy }}>
                        {item.name}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>
                        Grade {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 1 }}>
                        {item.divisions.length} division{item.divisions.length === 1 ? "" : "s"}
                    </Text>
                </View>
                <Pressable
                    onPress={() => onDelete(item)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete Grade ${item.name}`}
                    style={({ pressed }) => ({
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: T.dangerLight,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Ionicons name="trash-outline" size={16} color={T.danger} />
                </Pressable>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {item.divisions.map((d) => (
                    <View
                        key={d.id}
                        style={{
                            backgroundColor: T.navyLight,
                            borderRadius: 999,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                        }}
                    >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: T.navy }}>
                            {item.name}-{d.name}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function GradesScreen() {
    const toast = useToast();
    const [grades, setGrades] = useState<GradeWithDivisions[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<GradeWithDivisions | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchGrades = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const { data, error } = await getGradesWithDivisions();
            if (error) { setError(true); return; }
            setGrades(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchGrades();
        }, [fetchGrades]),
    );

    const handleDelete = useCallback(async () => {
        if (!pendingDelete) return;
        try {
            setDeleting(true);
            const { error } = await deleteGrade(pendingDelete.id);
            if (error) {
                toast.error("Delete Failed", error.message || "Unable to delete grade");
                return;
            }
            toast.success("Deleted", `Grade ${pendingDelete.name} was removed`);
            setPendingDelete(null);
            fetchGrades();
        } finally {
            setDeleting(false);
        }
    }, [pendingDelete, fetchGrades, toast]);

    if (loading) {
        return <LoadingState title="Loading Grades" subtitle="Fetching grades and divisions..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch grades. Please try again."
                onRetry={fetchGrades}
            />
        );
    }

    return (
        <ScreenWrapper backgroundColor={T.background}>
            <PageHeader
                title="Manage Grades"
                subtitle={`${grades.length} grade${grades.length === 1 ? "" : "s"}`}
                showBack
                action={
                    <AppButton
                        label="+ Add"
                        onPress={() => router.push("/(admin)/grades/create")}
                        size="sm"
                        variant="navy"
                    />
                }
            />

            <FlatList
                data={grades}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <GradeCard item={item} onDelete={setPendingDelete} />
                )}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={
                    <EmptyState
                        title="No Grades Yet"
                        subtitle='Tap "+ Add" to create the first grade and its class accounts.'
                        icon="school-outline"
                        iconColor={T.navy}
                        iconBgColor={T.navyLight}
                        actionLabel="Add Grade"
                        onAction={() => router.push("/(admin)/grades/create")}
                    />
                }
            />

            <ConfirmDialog
                visible={!!pendingDelete}
                variant="danger"
                title={pendingDelete ? `Delete Grade ${pendingDelete.name}?` : ""}
                subtitle="This permanently removes its divisions and class/coordinator accounts. Grades with enrolled students can't be deleted."
                confirmLabel={deleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </ScreenWrapper>
    );
}
