import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { LayoutAnimation, Platform, Pressable, ScrollView, Text, TextInput, UIManager, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppButton from "@/components/common/AppButton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import StudentFeeRow from "@/components/students/StudentFeeRow";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import {
    AcademicMonthOption,
    formatAcademicMonth,
    getDefaultAcademicMonth,
} from "@/utils/academicYear";
import { ClassGroup, groupByClass } from "@/utils/report";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background: "#f7fafc",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
    success: "#2d7a4d",
    warning: "#b7791f",
    danger: "#e53e3e",
} as const;

// ─── Class Row (collapsed header + expandable student list) ─────────────────
function ClassRow({
    group,
    expanded,
    onToggle,
    onPay,
}: {
    group: ClassGroup;
    expanded: boolean;
    onToggle: () => void;
    onPay: (studentId: string) => void;
}) {
    const collectionRate = group.students.length > 0
        ? Math.round((group.paidCount / group.students.length) * 100)
        : 0;

    return (
        <View
            style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: T.outline,
                marginBottom: 12,
                overflow: "hidden",
            }}
        >
            <Pressable
                onPress={onToggle}
                accessibilityRole="button"
                accessibilityLabel={`${expanded ? "Collapse" : "Expand"} Grade ${group.gradeName} Division ${group.divisionName}`}
                style={({ pressed }) => ({ padding: 16, opacity: pressed ? 0.85 : 1 })}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: T.navyLight,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                    >
                        <Text style={{ fontSize: 14, fontWeight: "800", color: T.navy }}>{group.label}</Text>
                    </View>

                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>
                            Grade {group.gradeName} · Division {group.divisionName}
                        </Text>
                        <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 2 }}>
                            {group.students.length} student{group.students.length === 1 ? "" : "s"} · {group.paidCount} paid
                        </Text>
                    </View>

                    <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                        {group.totalPending > 0 ? (
                            <Text style={{ fontSize: 14, fontWeight: "800", color: T.danger }}>
                                ₹{group.totalPending.toLocaleString()}
                            </Text>
                        ) : (
                            <Ionicons name="checkmark-circle" size={20} color={T.success} />
                        )}
                        {group.totalPending > 0 && (
                            <Text style={{ fontSize: 10, color: T.onSurfaceVariant, marginTop: 1 }}>pending</Text>
                        )}
                    </View>

                    <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={T.onSurfaceVariant}
                    />
                </View>

                {/* Collection progress bar */}
                <View style={{ height: 5, backgroundColor: T.outline, borderRadius: 999, overflow: "hidden", marginTop: 12 }}>
                    <View
                        style={{
                            width: `${collectionRate}%`,
                            height: 5,
                            backgroundColor: collectionRate === 100 ? T.success : T.navy,
                            borderRadius: 999,
                        }}
                    />
                </View>
            </Pressable>

            {expanded && (
                <View style={{ borderTopWidth: 1, borderTopColor: T.outline, padding: 12, backgroundColor: "#f1f4f6" }}>
                    {group.students.map((student) => {
                        const pending = student.status === "Excluded"
                            ? 0
                            : Math.max(0, (student.fee ?? 0) - (student.paid_amount ?? 0));
                        const tone = student.status === "Paid"
                            ? T.success
                            : student.status === "Partial"
                                ? T.warning
                                : student.status === "Excluded"
                                    ? T.onSurfaceVariant
                                    : T.danger;

                        return (
                            <View
                                key={student.id}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: "#ffffff",
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: T.outline,
                                    padding: 12,
                                    marginBottom: 8,
                                }}
                            >
                                <Pressable
                                    onPress={() => router.push({ pathname: "/(admin)/students/[id]", params: { id: student.id } })}
                                    style={{ flex: 1, marginRight: 8 }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`View ${student.name}`}
                                >
                                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: T.onSurface }}>
                                        {student.name}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 1 }}>
                                        #{student.admission_no}
                                    </Text>
                                </Pressable>

                                <View style={{ alignItems: "flex-end", marginRight: pending > 0 ? 10 : 0 }}>
                                    <Text style={{ fontSize: 12, fontWeight: "800", color: tone }}>
                                        {student.status === "Excluded" ? "Excluded" : pending > 0 ? `₹${pending}` : "Paid"}
                                    </Text>
                                    {pending > 0 && student.status !== "Excluded" && (
                                        <Text style={{ fontSize: 10, color: T.onSurfaceVariant, marginTop: 1 }}>pending</Text>
                                    )}
                                </View>

                                {pending > 0 && student.status !== "Excluded" && (
                                    <Pressable
                                        onPress={() => onPay(student.id)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Collect payment from ${student.name}`}
                                        style={({ pressed }) => ({
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 4,
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 10,
                                            backgroundColor: T.navy,
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                    >
                                        <Ionicons name="cash-outline" size={14} color="#ffffff" />
                                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>Pay</Text>
                                    </Pressable>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function StudentsScreen() {
    const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() => getDefaultAcademicMonth());
    const [rows, setRows] = useState<ReportStudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    const fetchRows = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const { data, error } = await getReportData({
                month: selectedMonth.month,
                year: selectedMonth.year,
            });
            if (error || !data) { setError(true); return; }
            setRows(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useFocusEffect(
        useCallback(() => {
            fetchRows();
        }, [fetchRows]),
    );

    const groups = useMemo(() => groupByClass(rows), [rows]);

    const searchResults = useMemo(() => {
        if (!search.trim()) return null;
        const q = search.toLowerCase();
        return rows.filter(
            (r) => r.name?.toLowerCase().includes(q) || r.admission_no?.toLowerCase().includes(q),
        );
    }, [rows, search]);

    const toggleGroup = (key: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedKey((prev) => (prev === key ? null : key));
    };

    const handlePay = (studentId: string) => {
        router.push({
            pathname: "/(admin)/students/add-payment",
            params: { studentId, month: selectedMonth.month, year: selectedMonth.year },
        });
    };

    if (loading) {
        return <LoadingState title="Loading Students" subtitle="Fetching fee status for this month..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load Students"
                subtitle="Could not fetch student records. Please try again."
                onRetry={fetchRows}
            />
        );
    }

    return (
        <ScreenWrapper backgroundColor={T.background}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <PageHeader
                    title="Students"
                    subtitle={`${rows.length} students · ${groups.length} classes`}
                    action={
                        <AppButton
                            label="+ Add"
                            onPress={() => router.push("/(admin)/students/create")}
                            size="sm"
                            variant="navy"
                        />
                    }
                />

                <View style={{ marginBottom: 4 }}>
                    <AcademicMonthSelect value={selectedMonth} onChange={setSelectedMonth} />
                </View>

                {/* Search */}
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
                    <Ionicons name="search" size={18} color={T.onSurfaceVariant} style={{ marginRight: 10 }} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by name or admission number..."
                        placeholderTextColor={T.onSurfaceVariant}
                        style={{ flex: 1, fontSize: 15, color: T.onSurface, paddingVertical: 10 }}
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel="Clear search">
                            <Ionicons name="close-circle" size={18} color={T.onSurfaceVariant} />
                        </Pressable>
                    )}
                </View>

                {/* Search results — flat list across every class */}
                {searchResults ? (
                    searchResults.length === 0 ? (
                        <EmptyState
                            title="No Results"
                            subtitle={`No students match "${search}"`}
                            icon="search-outline"
                            iconColor={T.navy}
                            iconBgColor={T.navyLight}
                        />
                    ) : (
                        searchResults.map((row) => (
                            <StudentFeeRow
                                key={row.id}
                                row={row}
                                onPress={() => router.push({ pathname: "/(admin)/students/[id]", params: { id: row.id } })}
                            />
                        ))
                    )
                ) : groups.length === 0 ? (
                    <EmptyState
                        title="No Students Yet"
                        subtitle='Tap "+ Add" to register the first student.'
                        icon="school-outline"
                        iconColor={T.navy}
                        iconBgColor={T.navyLight}
                    />
                ) : (
                    <>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: T.onSurface, marginBottom: 10 }}>
                            Classes — {formatAcademicMonth(selectedMonth)}
                        </Text>
                        {groups.map((group) => (
                            <ClassRow
                                key={group.key}
                                group={group}
                                expanded={expandedKey === group.key}
                                onToggle={() => toggleGroup(group.key)}
                                onPay={handlePay}
                            />
                        ))}
                    </>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
