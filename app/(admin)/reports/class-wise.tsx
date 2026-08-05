import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppButton from "@/components/common/AppButton";
import AppSelect from "@/components/common/AppSelect";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import StudentResultRow from "@/components/reports/StudentResultRow";
import { Colors, Radius, Shadows } from "@/constants/colors";
import { getClasses, resolveClassFilter } from "@/services/class.service";
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { AcademicMonthOption, formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { DetailedReportRow, generateDetailedReport } from "@/utils/generateDetailedReport";
import { generateReportSummary } from "@/utils/report";

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
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <PageHeader title="Class-wise Report" subtitle="Collection breakdown for one class" showBack />

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
                    onPress={handleGenerate}
                    loading={generating}
                    disabled={generating}
                    fullWidth
                />

                {reportRows && (
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
                                {selectedClass} — {formatAcademicMonth(selectedMonth)}
                            </Text>
                            <Text style={{ fontSize: 12, color: Colors.textMuted }}>{reportRows.length} students</Text>
                        </View>

                        {reportRows.length === 0 ? (
                            <View style={{ alignItems: "center", paddingVertical: 24 }}>
                                <Ionicons name="school-outline" size={28} color={Colors.textMuted} />
                                <Text style={{ marginTop: 8, fontSize: 13, color: Colors.textMuted }}>
                                    No students in this class yet.
                                </Text>
                            </View>
                        ) : (
                            <View style={{ marginTop: 8 }}>
                                {reportRows.map((row, idx) => (
                                    <StudentResultRow key={row.studentId} row={row} isLast={idx === reportRows.length - 1} />
                                ))}
                            </View>
                        )}

                        {reportRows.length > 0 && (
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
