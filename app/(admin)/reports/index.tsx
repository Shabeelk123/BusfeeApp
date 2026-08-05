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
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { AcademicMonthOption, formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { generateDetailedReport } from "@/utils/generateDetailedReport";
import { generateReportSummary } from "@/utils/report";

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ReportsHub() {
    const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() => getDefaultAcademicMonth());
    const [rows, setRows] = useState<ReportStudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showCollectionDetail, setShowCollectionDetail] = useState(false);
    const [downloadingCollection, setDownloadingCollection] = useState(false);

    const fetchData = useCallback(async () => {
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
            fetchData();
        }, [fetchData]),
    );

    const summary = useMemo(() => generateReportSummary({ rows }), [rows]);
    const studentsPaid = useMemo(() => rows.filter((r) => r.status === "Paid").length, [rows]);

    const handleDownloadCollection = async () => {
        try {
            setDownloadingCollection(true);
            await downloadReportPdf({
                reportRows: generateDetailedReport({ rows }),
                summary,
                selectedClass: "All Classes",
                selectedMonth: selectedMonth.month,
                selectedYear: selectedMonth.year,
            });
        } finally {
            setDownloadingCollection(false);
        }
    };

    if (loading) {
        return <LoadingState title="Loading Reports" subtitle="Fetching this month's data..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Reports Unavailable"
                subtitle="Could not load report data. Please try again."
                onRetry={fetchData}
            />
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <PageHeader title="Reports" subtitle="Fee collection reports & summaries" showBack />

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
                    description={`Whole-school collection summary for ${formatAcademicMonth(selectedMonth)}.`}
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
                    description="Collection breakdown for one specific class, for any academic month."
                    icon="school-outline"
                    onView={() => router.push("/(admin)/reports/class-wise")}
                    onDownload={() => router.push("/(admin)/reports/class-wise")}
                />

                <ReportCard
                    title="Defaulters Report"
                    description="Students with outstanding dues — for one class or the whole school."
                    icon="warning-outline"
                    onView={() => router.push("/(admin)/reports/defaulters")}
                    onDownload={() => router.push("/(admin)/reports/defaulters")}
                />
            </ScrollView>
        </ScreenWrapper>
    );
}
