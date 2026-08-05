import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppButton from "@/components/common/AppButton";
import AppSelect from "@/components/common/AppSelect";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import DefaulterRow from "@/components/reports/DefaulterRow";
import { Colors, Radius, Shadows } from "@/constants/colors";
import { getClasses, resolveClassFilter } from "@/services/class.service";
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { AcademicMonthOption, formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { DetailedReportRow, generateDetailedReport } from "@/utils/generateDetailedReport";
import { generateReportSummary } from "@/utils/report";

export default function DefaultersReportScreen() {
    const toast = useToast();

    const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() => getDefaultAcademicMonth());
    const [classOptions, setClassOptions] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("ALL");

    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [rawRows, setRawRows] = useState<ReportStudentRow[] | null>(null);

    useEffect(() => {
        (async () => {
            const { data } = await getClasses();
            setClassOptions(data);
        })();
    }, []);

    // Only the defaulting students (Pending or Partial) — Paid/Excluded are
    // out of scope for this report by definition.
    const defaulterRows = useMemo<DetailedReportRow[] | null>(() => {
        if (!rawRows) return null;
        return generateDetailedReport({ rows: rawRows }).filter((r) => r.pending > 0);
    }, [rawRows]);

    const handleGenerate = async () => {
        try {
            setGenerating(true);

            const { gradeId, divisionId } = await resolveClassFilter(selectedClass);
            const { data, error } = await getReportData({
                gradeId,
                divisionId,
                month: selectedMonth.month,
                year: selectedMonth.year,
            });

            if (error || !data) {
                toast.error("Generation Failed", "Could not generate the report. Please try again.");
                return;
            }

            setRawRows(data);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!rawRows || !defaulterRows) return;
        try {
            setDownloading(true);
            // Summary reflects only the defaulting rows being downloaded, not
            // the whole scope — a "Defaulters Report" summarizing paid students
            // would be misleading.
            const summary = generateReportSummary({
                rows: rawRows.filter((r) => r.status === "Pending" || r.status === "Partial"),
            });
            await downloadReportPdf({
                reportRows: defaulterRows,
                summary,
                selectedClass: selectedClass === "ALL" ? "All Classes" : selectedClass,
                selectedMonth: selectedMonth.month,
                selectedYear: selectedMonth.year,
            });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <PageHeader title="Defaulters Report" subtitle="Students with outstanding dues" showBack />

                <View style={{ marginBottom: 4 }}>
                    <AcademicMonthSelect
                        value={selectedMonth}
                        onChange={(m) => { setSelectedMonth(m); setRawRows(null); }}
                    />
                </View>

                <AppSelect
                    label="Class"
                    iconName="funnel-outline"
                    value={selectedClass}
                    options={classOptions.map((c) => ({ label: c === "ALL" ? "All Classes" : c, value: c }))}
                    searchable
                    onChange={(v) => { setSelectedClass(String(v)); setRawRows(null); }}
                />

                <AppButton
                    label="Generate Report"
                    iconLeft="reload-outline"
                    onPress={handleGenerate}
                    loading={generating}
                    disabled={generating}
                    fullWidth
                />

                {defaulterRows && (
                    <View
                        style={[
                            {
                                marginTop: 20,
                                borderRadius: Radius.card,
                                backgroundColor: Colors.card,
                                borderWidth: 1,
                                borderColor: Colors.cardBorderLight,
                                padding: 16,
                            },
                            Shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.textPrimary }}>
                                {selectedClass === "ALL" ? "All Classes" : selectedClass} — {formatAcademicMonth(selectedMonth)}
                            </Text>
                            <Text style={{ fontSize: 12, color: Colors.textMuted }}>{defaulterRows.length} defaulters</Text>
                        </View>

                        {defaulterRows.length === 0 ? (
                            <View style={{ alignItems: "center", paddingVertical: 24 }}>
                                <Ionicons name="checkmark-circle-outline" size={28} color={Colors.success} />
                                <Text style={{ marginTop: 8, fontSize: 13, color: Colors.textMuted }}>
                                    No outstanding dues for this selection.
                                </Text>
                            </View>
                        ) : (
                            <View style={{ marginTop: 8 }}>
                                {defaulterRows.map((row, idx) => (
                                    <DefaulterRow key={row.studentId} row={row} isLast={idx === defaulterRows.length - 1} />
                                ))}
                            </View>
                        )}

                        {defaulterRows.length > 0 && (
                            <View style={{ marginTop: 16 }}>
                                <AppButton
                                    label="Download PDF"
                                    variant="primary"
                                    iconLeft="download-outline"
                                    onPress={handleDownload}
                                    loading={downloading}
                                    disabled={downloading}
                                    fullWidth
                                />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
