import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";
import AppSelect from "../../components/common/AppSelect";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { getClasses } from "../../services/class.service";
import { downloadReportPdf } from "../../services/report-pdf.service";
import { getReportData } from "../../services/report.service";
import { generateDetailedReport } from "../../utils/generateDetailedReport";
import { generateReportSummary } from "../../utils/report";

// ─── Small summary stat card ──────────────────────────────────────────────────
function SummaryCard({
    iconName,
    iconColor,
    bgColor,
    value,
    label,
    valueColor,
}: {
    iconName: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    bgColor: string;
    value: string | number;
    label: string;
    valueColor: string;
}) {
    return (
        <View className={`mb-4 w-[48%] rounded-3xl p-5 ${bgColor}`}>
            <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-white/30">
                <Ionicons name={iconName} size={20} color={iconColor} />
            </View>
            <Text className={`text-3xl font-black ${valueColor}`}>{value}</Text>
            <Text className="mt-1 text-sm font-medium text-white/70">{label}</Text>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
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
        }, [selectedClass, selectedMonth])
    );

    if (loading) {
        return <LoadingState title="Generating Report" subtitle="Crunching the numbers…" />;
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

    return (
        <ScreenWrapper>
            <FlatList
                data={reportRows}
                keyExtractor={(item) => item.studentId}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* ── Page Title ── */}
                        <View className="mb-6">
                            <Text className="text-3xl font-black text-gray-900">Reports</Text>
                            <Text className="mt-1 text-gray-500">Financial overview across all students</Text>
                        </View>

                        {/* ── Collection Rate Banner ── */}
                        <View className="mb-5 overflow-hidden rounded-3xl bg-indigo-600 p-6">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                                        Collection Rate
                                    </Text>
                                    <Text className="mt-2 text-5xl font-black text-white">
                                        {summary?.collectionRate ?? 0}%
                                    </Text>
                                    <Text className="mt-1 text-sm text-indigo-200">
                                        of expected fees collected
                                    </Text>
                                </View>
                                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                                    <Ionicons name="pie-chart" size={36} color="white" />
                                </View>
                            </View>
                            <View className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-800">
                                <View
                                    className="h-2 rounded-full bg-white"
                                    style={{ width: `${summary?.collectionRate ?? 0}%` }}
                                />
                            </View>
                        </View>

                        {/* ── Summary Stat Cards ── */}
                        <View className="mb-5 flex-row flex-wrap justify-between">
                            <SummaryCard
                                iconName="school-outline"
                                iconColor="white"
                                bgColor="bg-blue-600"
                                value={summary?.totalStudents ?? 0}
                                label="Students"
                                valueColor="text-white"
                            />
                            <SummaryCard
                                iconName="cash-outline"
                                iconColor="white"
                                bgColor="bg-emerald-600"
                                value={`₹${summary?.totalCollection ?? 0}`}
                                label="Collected"
                                valueColor="text-white"
                            />
                            <SummaryCard
                                iconName="alert-circle-outline"
                                iconColor="white"
                                bgColor="bg-red-500"
                                value={`₹${summary?.totalPending ?? 0}`}
                                label="Pending"
                                valueColor="text-white"
                            />
                            <SummaryCard
                                iconName="people-outline"
                                iconColor="white"
                                bgColor="bg-orange-500"
                                value={summary?.defaultersCount ?? 0}
                                label="Defaulters"
                                valueColor="text-white"
                            />
                        </View>

                        {/* ── Filters ── */}
                        <AppSelect
                            value={selectedClass}
                            options={classes.map(
                                (item) => ({
                                    label: item,
                                    value: item,
                                })
                            )}
                            onChange={(value) =>
                                setSelectedClass(
                                    String(value)
                                )
                            }
                        />


                        <AppSelect
                            value={selectedMonth}
                            options={[
                                {
                                    label: "January",
                                    value: 1,
                                },
                                {
                                    label: "February",
                                    value: 2,
                                },
                                {
                                    label: "March",
                                    value: 3,
                                },
                                {
                                    label: "April",
                                    value: 4,
                                },
                                {
                                    label: "May",
                                    value: 5,
                                },
                                {
                                    label: "June",
                                    value: 6,
                                },
                                {
                                    label: "July",
                                    value: 7,
                                },
                                {
                                    label: "August",
                                    value: 8,
                                },
                                {
                                    label: "September",
                                    value: 9,
                                },
                                {
                                    label: "October",
                                    value: 10,
                                },
                                {
                                    label: "November",
                                    value: 11,
                                },
                                {
                                    label: "December",
                                    value: 12,
                                },
                            ]}
                            onChange={(value) =>
                                setSelectedMonth(
                                    Number(value)
                                )
                            }
                        />

                        {/* ── Download Button ── */}
                        <Pressable
                            onPress={() => downloadReportPdf({ reportRows, summary, selectedClass, selectedMonth, selectedYear })}
                            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                            className="mb-6 flex-row items-center justify-center rounded-2xl bg-blue-600 py-4"
                        >
                            <Ionicons name="download-outline" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-base font-bold text-white">Download PDF</Text>
                        </Pressable>

                        {/* ── Table Header ── */}
                        <View className="mb-2 flex-row items-center border-b border-gray-200 pb-3">
                            <Text className="flex-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                                Student
                            </Text>
                            <Text className="w-20 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                                Paid
                            </Text>
                            <Text className="w-20 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                                Pending
                            </Text>
                        </View>
                    </>
                }
                renderItem={({ item }) => (
                    <View className="flex-row items-center border-b border-gray-100 py-4">
                        <View className="flex-1">
                            <Text numberOfLines={1} className="font-semibold text-gray-900">
                                {item.studentName}
                            </Text>
                            <Text className="mt-0.5 text-xs text-gray-400">{item.className}</Text>
                        </View>
                        <Text className="w-20 text-right text-sm font-bold text-emerald-600">
                            ₹{item.paid}
                        </Text>
                        <Text className={`w-20 text-right text-sm font-bold ${item.pending > 0 ? "text-red-500" : "text-blue-500"}`}>
                            {item.pending > 0 ? `₹${item.pending}` : "Paid"}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <EmptyState
                        title="No Report Data"
                        subtitle="No student records found for the selected filters."
                        icon="document-text-outline"
                        iconColor="#9CA3AF"
                        iconBgColor="#F3F4F6"
                    />
                }
            />
        </ScreenWrapper>
    );
}