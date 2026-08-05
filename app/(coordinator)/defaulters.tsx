import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppSelect from "@/components/common/AppSelect";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import StudentFeeRow from "@/components/students/StudentFeeRow";
import { Colors } from "@/constants/colors";
import { ALL_CLASSES, useCoordinatorGrade } from "@/hooks/useCoordinatorGrade";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { AcademicMonthOption, getDefaultAcademicMonth } from "@/utils/academicYear";

// Read-only, grade-scoped Defaulters screen — Academic Month + Class filter
// (both restricted to the coordinator's grade via useCoordinatorGrade) +
// Search, built on the same getReportData/StudentFeeRow the Admin Students
// list and Coordinator Students screen already use, filtered down to rows
// with an outstanding balance (Pending or Partial).
export default function CoordinatorDefaultersScreen() {
    const { gradeId, gradeName, divisionOptions, loading: gradeLoading, error: gradeError, load: loadGrade } = useCoordinatorGrade();

    const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() => getDefaultAcademicMonth());
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>(ALL_CLASSES);
    const [search, setSearch] = useState("");

    const [rows, setRows] = useState<ReportStudentRow[]>([]);
    const [rowsLoading, setRowsLoading] = useState(true);
    const [rowsError, setRowsError] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadGrade();
        }, [loadGrade]),
    );

    const fetchRows = useCallback(async () => {
        if (!gradeId) return;
        try {
            setRowsLoading(true);
            setRowsError(false);
            const { data, error } = await getReportData({
                gradeId,
                divisionId: selectedDivisionId !== ALL_CLASSES ? selectedDivisionId : undefined,
                month: selectedMonth.month,
                year: selectedMonth.year,
            });
            if (error || !data) { setRowsError(true); return; }
            setRows(data);
        } catch {
            setRowsError(true);
        } finally {
            setRowsLoading(false);
        }
    }, [gradeId, selectedDivisionId, selectedMonth]);

    useFocusEffect(
        useCallback(() => {
            if (gradeId) fetchRows();
        }, [gradeId, fetchRows]),
    );

    // Defaulters = an outstanding balance this month — Paid/Excluded are out.
    const defaulterRows = useMemo(
        () => rows.filter((r) => r.status === "Pending" || r.status === "Partial"),
        [rows],
    );

    const filteredRows = useMemo(() => {
        if (!search.trim()) return defaulterRows;
        const lower = search.toLowerCase();
        return defaulterRows.filter(
            (r) => r.name?.toLowerCase().includes(lower) || r.admission_no?.toLowerCase().includes(lower),
        );
    }, [defaulterRows, search]);

    const loading = gradeLoading || rowsLoading;
    const error = gradeError || rowsError;

    if (loading) {
        return <LoadingState title="Loading Defaulters" subtitle="Fetching pending students…" />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch defaulters. Please try again."
                onRetry={() => { loadGrade(); fetchRows(); }}
            />
        );
    }

    return (
        <ScreenWrapper>
            <FlatList
                data={filteredRows}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
                // Row cards below carry their own elevation (card shadow), which on
                // Android wins stacking over plain zIndex — the header (and its open
                // dropdowns) needs a higher elevation too or list rows draw over it.
                ListHeaderComponentStyle={{ zIndex: 10, elevation: 10 }}
                renderItem={({ item }) => (
                    <StudentFeeRow
                        row={item}
                        onPress={() =>
                            router.push({
                                pathname: "/(coordinator)/students/[id]",
                                params: { id: item.id },
                            })
                        }
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        title={search.trim() ? "No Results" : "No Defaulters"}
                        subtitle={
                            search.trim()
                                ? `No defaulters match "${search}"`
                                : "All students in your grade have cleared their dues for this month."
                        }
                        icon="checkmark-circle-outline"
                        iconColor={Colors.success}
                        iconBgColor={Colors.successLight}
                    />
                }
                ListHeaderComponent={
                    <>
                        <PageHeader
                            title="Defaulters"
                            subtitle={gradeName ? `Grade ${gradeName} · outstanding dues` : "Outstanding dues"}
                            showBack
                        />

                        {/* Academic Month + Class Filter */}
                        <View style={{ flexDirection: "row", gap: 10, zIndex: 10 }}>
                            <View style={{ flex: 1 }}>
                                <AcademicMonthSelect value={selectedMonth} onChange={setSelectedMonth} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppSelect
                                    label="Class"
                                    iconName="funnel-outline"
                                    value={selectedDivisionId}
                                    options={divisionOptions}
                                    searchable={false}
                                    onChange={(v) => setSelectedDivisionId(String(v))}
                                />
                            </View>
                        </View>

                        {/* Search */}
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
                                onChangeText={setSearch}
                                placeholder="Search by name or admission number..."
                                placeholderTextColor={Colors.textMuted}
                                style={{ flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 10 }}
                            />
                            {search.length > 0 && (
                                <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel="Clear search">
                                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                                </Pressable>
                            )}
                        </View>

                        {/* Alert banner */}
                        {filteredRows.length > 0 && (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: Colors.dangerLight,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: Colors.dangerBorder,
                                    padding: 14,
                                    marginBottom: 16,
                                }}
                            >
                                <Ionicons name="warning-outline" size={20} color={Colors.danger} style={{ marginRight: 10 }} />
                                <Text style={{ flex: 1, fontSize: 13, color: Colors.danger, lineHeight: 18, fontWeight: "500" }}>
                                    {filteredRows.length} student{filteredRows.length !== 1 ? "s" : ""} have outstanding fee dues. Please follow up.
                                </Text>
                            </View>
                        )}
                    </>
                }
            />
        </ScreenWrapper>
    );
}
