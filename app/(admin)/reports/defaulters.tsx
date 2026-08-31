import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppButton from "@/components/common/AppButton";
import AppSelect from "@/components/common/AppSelect";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import DefaulterRow from "@/components/reports/DefaulterRow";
import ReportResultCard from "@/components/reports/ReportResultCard";
import { getClasses, resolveClassFilter } from "@/services/class.service";
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { AcademicMonthOption, formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { DetailedReportRow, generateDetailedReport } from "@/utils/generateDetailedReport";
import { generateReportSummary } from "@/utils/report";

const T = { background: "#f7fafc", success: "#2d7a4d" } as const;

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
        <ScreenWrapper backgroundColor={T.background}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>
                    <PageHeader title="Defaulters Report" showBack />

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
                        variant="navy"
                        onPress={handleGenerate}
                        loading={generating}
                        disabled={generating}
                        fullWidth
                    />

                    {defaulterRows && (
                        <ReportResultCard
                            title={`${selectedClass === "ALL" ? "All Classes" : selectedClass} — ${formatAcademicMonth(selectedMonth)}`}
                            countLabel={`${defaulterRows.length} defaulters`}
                            isEmpty={defaulterRows.length === 0}
                            emptyIcon="checkmark-circle-outline"
                            emptyIconColor={T.success}
                            emptyText="No outstanding dues for this selection."
                            onDownload={handleDownload}
                            downloading={downloading}
                        >
                            {defaulterRows.map((row, idx) => (
                                <DefaulterRow key={row.studentId} row={row} isLast={idx === defaulterRows.length - 1} />
                            ))}
                        </ReportResultCard>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
