import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";

import AppSelect from "@/components/common/AppSelect";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors, Shadows } from "@/constants/colors";
import { getClasses } from "@/services/class.service";
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData } from "@/services/report.service";
import { generateDetailedReport } from "@/utils/generateDetailedReport";
import { generateReportSummary } from "@/utils/report";

// ── Month options ─────────────────────────────────────────────────────────────
const MONTHS = [
    { label: "January",   value: 1  },
    { label: "February",  value: 2  },
    { label: "March",     value: 3  },
    { label: "April",     value: 4  },
    { label: "May",       value: 5  },
    { label: "June",      value: 6  },
    { label: "July",      value: 7  },
    { label: "August",    value: 8  },
    { label: "September", value: 9  },
    { label: "October",   value: 10 },
    { label: "November",  value: 11 },
    { label: "December",  value: 12 },
];

// ── Summary Stat Card ─────────────────────────────────────────────────────────
function SummaryCard({
    iconName,
    iconColor,
    bgColor,
    value,
    label,
}: {
    iconName: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    bgColor: string;
    value: string | number;
    label: string;
}) {
    return (
        <View
            style={[
                {
                    width: "48%",
                    borderRadius: 16,
                    backgroundColor: bgColor,
                    padding: 16,
                    marginBottom: 12,
                },
                Shadows.card,
            ]}
        >
            <View
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(255,255,255,0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                }}
            >
                <Ionicons name={iconName} size={18} color={iconColor} />
            </View>
            <Text
                style={{
                    fontSize: 26,
                    fontWeight: "900",
                    color: iconColor,
                    letterSpacing: -0.5,
                }}
            >
                {value}
            </Text>
            <Text
                style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.75)",
                }}
            >
                {label}
            </Text>
        </View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ReportsScreen() {
    const now = new Date();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [reportRows, setReportRows] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("ALL");
    const [classes, setClasses] = useState<string[]>(["ALL"]);
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear] = useState(now.getFullYear());

    const fetchClasses = async () => {
        const { data, error } = await getClasses();
        if (error) { console.log(error); return; }
        setClasses(data);
    };

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(false);
            const { data, error } = await getReportData({ selectedClass });
            if (error || !data) { console.log(error); setError(true); return; }

            const summaryData = generateReportSummary({
                students: data.students,
                feeAssignments: data.feeAssignments,
                transactions: data.transactions,
                selectedMonth,
                selectedYear,
            });
            setSummary(summaryData);

            const detailedRows = generateDetailedReport({
                students: data.students,
                feeAssignments: data.feeAssignments,
                transactions: data.transactions,
                selectedMonth,
                selectedYear,
            });
            setReportRows(detailedRows);
        } catch (err) {
            console.log(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchClasses();
            fetchReports();
        }, [selectedClass, selectedMonth]),
    );

    if (loading) {
        return (
            <LoadingState title="Generating Report" subtitle="Crunching the numbers…" />
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Report Unavailable"
                subtitle="Could not generate the report. Please try again."
                onRetry={fetchReports}
            />
        );
    }

    const collectionRate = summary?.collectionRate ?? 0;

    return (
        <ScreenWrapper>
            <FlatList
                data={reportRows}
                keyExtractor={(item) => item.studentId}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListHeaderComponent={
                    <>
                        {/* Page Header */}
                        <PageHeader
                            title="Reports"
                            subtitle="Financial overview across all students"
                            showBack
                        />

                        {/* Collection Rate Banner */}
                        <View
                            style={[
                                {
                                    borderRadius: 20,
                                    backgroundColor: Colors.primary,
                                    padding: 20,
                                    marginBottom: 16,
                                    overflow: "hidden",
                                },
                                Shadows.cardMd,
                            ]}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: 16,
                                }}
                            >
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: "700",
                                            letterSpacing: 1.5,
                                            textTransform: "uppercase",
                                            color: "rgba(255,255,255,0.65)",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Collection Rate
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 48,
                                            fontWeight: "900",
                                            color: Colors.textOnDark,
                                            letterSpacing: -1,
                                        }}
                                    >
                                        {collectionRate}%
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            color: "rgba(255,255,255,0.65)",
                                        }}
                                    >
                                        of expected fees collected
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: 18,
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Ionicons name="pie-chart" size={32} color="white" />
                                </View>
                            </View>

                            {/* Progress bar */}
                            <View
                                style={{
                                    height: 8,
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    borderRadius: 999,
                                    overflow: "hidden",
                                }}
                            >
                                <View
                                    style={{
                                        height: 8,
                                        width: `${Math.min(collectionRate, 100)}%`,
                                        backgroundColor: Colors.textOnDark,
                                        borderRadius: 999,
                                    }}
                                />
                            </View>
                        </View>

                        {/* Summary Stat Cards */}
                        <View
                            style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                marginBottom: 16,
                            }}
                        >
                            <SummaryCard
                                iconName="school-outline"
                                iconColor="white"
                                bgColor="#2563EB"
                                value={summary?.totalStudents ?? 0}
                                label="Students"
                            />
                            <SummaryCard
                                iconName="cash-outline"
                                iconColor="white"
                                bgColor={Colors.success}
                                value={`₹${summary?.totalCollection ?? 0}`}
                                label="Collected"
                            />
                            <SummaryCard
                                iconName="alert-circle-outline"
                                iconColor="white"
                                bgColor={Colors.danger}
                                value={`₹${summary?.totalPending ?? 0}`}
                                label="Pending"
                            />
                            <SummaryCard
                                iconName="people-outline"
                                iconColor="white"
                                bgColor={Colors.warning}
                                value={summary?.defaultersCount ?? 0}
                                label="Defaulters"
                            />
                        </View>

                        {/* Filters */}
                        <View style={{ marginBottom: 8 }}>
                            <AppSelect
                                value={selectedClass}
                                options={classes.map((item) => ({
                                    label: item,
                                    value: item,
                                }))}
                                onChange={(value) =>
                                    setSelectedClass(String(value))
                                }
                            />
                        </View>
                        <View style={{ marginBottom: 16 }}>
                            <AppSelect
                                value={selectedMonth}
                                options={MONTHS}
                                onChange={(value) =>
                                    setSelectedMonth(Number(value))
                                }
                            />
                        </View>

                        {/* Download Button */}
                        <Pressable
                            onPress={() =>
                                downloadReportPdf({
                                    reportRows,
                                    summary,
                                    selectedClass,
                                    selectedMonth,
                                    selectedYear,
                                })
                            }
                            style={({ pressed }) => ({
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: Colors.primary,
                                borderRadius: 14,
                                paddingVertical: 14,
                                marginBottom: 20,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Download PDF report"
                        >
                            <Ionicons
                                name="download-outline"
                                size={20}
                                color="white"
                                style={{ marginRight: 8 }}
                            />
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: "700",
                                    color: "white",
                                }}
                            >
                                Download PDF
                            </Text>
                        </Pressable>

                        {/* Table Header */}
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                borderBottomWidth: 1,
                                borderBottomColor: Colors.cardBorder,
                                paddingBottom: 10,
                                marginBottom: 4,
                            }}
                        >
                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 11,
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                    color: Colors.textMuted,
                                }}
                            >
                                Student
                            </Text>
                            <Text
                                style={{
                                    width: 72,
                                    textAlign: "right",
                                    fontSize: 11,
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                    color: Colors.textMuted,
                                }}
                            >
                                Paid
                            </Text>
                            <Text
                                style={{
                                    width: 72,
                                    textAlign: "right",
                                    fontSize: 11,
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                    color: Colors.textMuted,
                                }}
                            >
                                Pending
                            </Text>
                        </View>
                    </>
                }
                renderItem={({ item }) => (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            borderBottomWidth: 1,
                            borderBottomColor: Colors.cardBorderLight,
                            paddingVertical: 14,
                        }}
                    >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text
                                numberOfLines={1}
                                style={{
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: Colors.textPrimary,
                                }}
                            >
                                {item.studentName}
                            </Text>
                            <Text
                                style={{
                                    marginTop: 2,
                                    fontSize: 12,
                                    color: Colors.textMuted,
                                }}
                            >
                                {item.className}
                            </Text>
                        </View>
                        <Text
                            style={{
                                width: 72,
                                textAlign: "right",
                                fontSize: 13,
                                fontWeight: "700",
                                color: Colors.success,
                            }}
                        >
                            ₹{item.paid}
                        </Text>
                        <Text
                            style={{
                                width: 72,
                                textAlign: "right",
                                fontSize: 13,
                                fontWeight: "700",
                                color:
                                    item.pending > 0
                                        ? Colors.danger
                                        : Colors.primary,
                            }}
                        >
                            {item.pending > 0 ? `₹${item.pending}` : "Paid"}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <EmptyState
                        title="No Report Data"
                        subtitle="No student records found for the selected filters."
                        icon="document-text-outline"
                        iconColor={Colors.textMuted}
                        iconBgColor={Colors.cardBorderLight}
                    />
                }
            />
        </ScreenWrapper>
    );
}