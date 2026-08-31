import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppButton from "@/components/common/AppButton";
import AppSelect from "@/components/common/AppSelect";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import ReportResultCard from "@/components/reports/ReportResultCard";
import StudentResultRow from "@/components/reports/StudentResultRow";
import { getClasses, resolveClassFilter } from "@/services/class.service";
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { AcademicMonthOption, formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { DetailedReportRow, generateDetailedReport } from "@/utils/generateDetailedReport";
import { generateReportSummary } from "@/utils/report";

const T = { background: "#f7fafc", onSurfaceVariant: "#44474d" } as const;

export default function ClassWiseReportScreen() {
    const toast = useToast();

    const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() => getDefaultAcademicMonth());
    const [classOptions, setClassOptions] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");

    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [rawRows, setRawRows] = useState<ReportStudentRow[] | null>(null);

    const reportRows = useMemo<DetailedReportRow[] | null>(
        () => (rawRows ? generateDetailedReport({ rows: rawRows }) : null),
        [rawRows],
    );

    useEffect(() => {
        (async () => {
            const { data } = await getClasses();
            // Class-wise Report always targets one specific class — no "ALL".
            setClassOptions(data.filter((c) => c !== "ALL"));
        })();
    }, []);

    const handleGenerate = async () => {
        if (!selectedClass) {
            toast.warning("Select a Class", "Choose a class to generate its report");
            return;
        }

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
        if (!rawRows || !reportRows) return;
        try {
            setDownloading(true);
            const summary = generateReportSummary({ rows: rawRows });
            await downloadReportPdf({
                reportRows,
                summary,
                selectedClass,
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
                    <PageHeader title="Class-wise Report" showBack />

                    <View style={{ marginBottom: 4 }}>
                        <AcademicMonthSelect
                            value={selectedMonth}
                            onChange={(m) => { setSelectedMonth(m); setRawRows(null); }}
                        />
                    </View>

                    <AppSelect
                        label="Class"
                        required
                        iconName="school-outline"
                        placeholder="Select a class"
                        value={selectedClass}
                        options={classOptions.map((c) => ({ label: c, value: c }))}
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

                    {reportRows && (
                        <ReportResultCard
                            title={`${selectedClass} — ${formatAcademicMonth(selectedMonth)}`}
                            countLabel={`${reportRows.length} students`}
                            isEmpty={reportRows.length === 0}
                            emptyIcon="school-outline"
                            emptyIconColor={T.onSurfaceVariant}
                            emptyText="No students in this class yet."
                            onDownload={handleDownload}
                            downloading={downloading}
                        >
                            {reportRows.map((row, idx) => (
                                <StudentResultRow key={row.studentId} row={row} isLast={idx === reportRows.length - 1} />
                            ))}
                        </ReportResultCard>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
