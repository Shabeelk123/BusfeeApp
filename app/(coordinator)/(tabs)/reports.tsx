import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import ReportCard from "@/components/reports/ReportCard";
import SummaryCard from "@/components/reports/SummaryCard";
import { Colors } from "@/constants/colors";
import { useCoordinatorGrade } from "@/hooks/useCoordinatorGrade";
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { AcademicMonthOption, formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { generateDetailedReport } from "@/utils/generateDetailedReport";
import { generateReportSummary } from "@/utils/report";

// ── Screen ───────────────────────────────────────────────────────────────────
// Thin, grade-scoped adaptation of app/(admin)/(tabs)/reports.tsx — same
// SummaryCard/ReportCard, same services, just `gradeId` added to the query
// so every number here reflects only this coordinator's own grade.
export default function CoordinatorReportsHub() {
    const { gradeId, gradeName, loading: gradeLoading, error: gradeError, load: loadGrade } = useCoordinatorGrade();

    const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() => getDefaultAcademicMonth());
    const [rows, setRows] = useState<ReportStudentRow[]>([]);
    const [rowsLoading, setRowsLoading] = useState(true);
    const [rowsError, setRowsError] = useState(false);
    const [showCollectionDetail, setShowCollectionDetail] = useState(false);
    const [downloadingCollection, setDownloadingCollection] = useState(false);

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
    }, [gradeId, selectedMonth]);

    useFocusEffect(
        useCallback(() => {
            if (gradeId) fetchRows();
        }, [gradeId, fetchRows]),
    );

    const summary = useMemo(() => generateReportSummary({ rows }), [rows]);
    const studentsPaid = useMemo(() => rows.filter((r) => r.status === "Paid").length, [rows]);

    const handleDownloadCollection = async () => {
        try {
            setDownloadingCollection(true);
            await downloadReportPdf({
                reportRows: generateDetailedReport({ rows }),
                summary,
                selectedClass: `Grade ${gradeName ?? "-"}`,
                selectedMonth: selectedMonth.month,
                selectedYear: selectedMonth.year,
            });
        } finally {
            setDownloadingCollection(false);
        }
    };

    const loading = gradeLoading || rowsLoading;
    const error = gradeError || rowsError;

    if (loading) {
        return <LoadingState title="Loading Reports" subtitle="Fetching this month's data..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Reports Unavailable"
                subtitle="Could not load report data. Please try again."
                onRetry={() => { loadGrade(); fetchRows(); }}
            />
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header — no back chevron, this is a primary tab now */}
                <PageHeader
                    title="Reports"
                    subtitle={gradeName ? `Grade ${gradeName} fee collection reports` : "Fee collection reports & summaries"}
                />

                {/* ── Academic Month ── */}
                <View style={{ marginBottom: 4 }}>
                    <AcademicMonthSelect value={selectedMonth} onChange={setSelectedMonth} />
                </View>

                {/* ── Summary Cards ── */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <SummaryCard
                        label="Total Collection"
                        value={`₹${summary.totalCollection.toLocaleString()}`}
                        icon="cash-outline"
                        iconColor={Colors.success}
                        iconBg={Colors.successLight}
                    />
                    <SummaryCard
                        label="Pending Amount"
                        value={`₹${summary.totalPending.toLocaleString()}`}
                        icon="alert-circle-outline"
                        iconColor={Colors.danger}
                        iconBg={Colors.dangerLight}
                    />
                </View>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
                    <SummaryCard
                        label="Students Paid"
                        value={String(studentsPaid)}
                        icon="checkmark-circle-outline"
                        iconColor={Colors.primary}
                        iconBg={Colors.primaryLight}
                    />
                    <SummaryCard
                        label="Defaulters"
                        value={String(summary.defaultersCount)}
                        icon="people-outline"
                        iconColor={Colors.warning}
                        iconBg={Colors.warningLight}
                    />
                </View>

                {/* ── Available Reports ── */}
                <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.textPrimary, marginBottom: 12 }}>
                    Available Reports
                </Text>

                <ReportCard
                    title="Collection Report"
                    description={`Grade ${gradeName ?? "-"} collection summary for ${formatAcademicMonth(selectedMonth)}.`}
                    icon="stats-chart-outline"
                    onView={() => setShowCollectionDetail((v) => !v)}
                    onDownload={handleDownloadCollection}
                    downloading={downloadingCollection}
                >
                    {showCollectionDetail && (
                        <View
                            style={{
                                borderRadius: 12,
                                backgroundColor: Colors.inputBg,
                                padding: 14,
                                marginBottom: 0,
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textSecondary }}>Collection Rate</Text>
                                <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.primary }}>{summary.collectionRate}%</Text>
                            </View>
                            <View style={{ height: 6, backgroundColor: Colors.cardBorderLight, borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
                                <View style={{ width: `${Math.min(summary.collectionRate, 100)}%`, height: 6, backgroundColor: Colors.primary, borderRadius: 999 }} />
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text style={{ fontSize: 12, color: Colors.textMuted }}>Total Students</Text>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textPrimary }}>{summary.totalStudents}</Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text style={{ fontSize: 12, color: Colors.textMuted }}>Expected</Text>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textPrimary }}>
                                    ₹{(summary.totalCollection + summary.totalPending).toLocaleString()}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={{ fontSize: 12, color: Colors.textMuted }}>Advance Credit</Text>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textPrimary }}>
                                    ₹{summary.totalAdvance.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    )}
                </ReportCard>

                <ReportCard
                    title="Class-wise Report"
                    description="Collection breakdown for one specific class in your grade, for any academic month."
                    icon="school-outline"
                    onView={() => router.push("/(coordinator)/reports/class-wise")}
                    onDownload={() => router.push("/(coordinator)/reports/class-wise")}
                />

                <ReportCard
                    title="Defaulters Report"
                    description="Students with outstanding dues — for one class or your whole grade."
                    icon="warning-outline"
                    onView={() => router.push("/(coordinator)/reports/defaulters")}
                    onDownload={() => router.push("/(coordinator)/reports/defaulters")}
                />
            </ScrollView>
        </ScreenWrapper>
    );
}
