import ScreenWrapper from "@/components/common/ScreenWrapper";
import { getClasses } from "@/services/class.service";
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData } from "@/services/report.service";
import { generateDetailedReport } from "@/utils/generateDetailedReport";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";
import { generateReportSummary } from "../../utils/report";

interface StatCardProps {
    label: string;
    value: string | number;
    emoji: string;
    bg: string;
    text: string;
    sub?: string;
}

function StatCard({ label, value, emoji, bg, text, sub }: StatCardProps) {
    return (
        <View className={`mb-4 rounded-2xl p-5 ${bg}`}>
            <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-400">{label}</Text>
                <Text className="text-2xl">{emoji}</Text>
            </View>
            <Text className={`text-3xl font-bold ${text}`}>{value}</Text>
            {sub && <Text className="mt-1 text-xs text-slate-500">{sub}</Text>}
        </View>
    );
}

export default function ReportsScreen() {
    const now = new Date();
    const [reportRows, setReportRows] =
        useState<any[]>([]);

    const [selectedMonth, setSelectedMonth] =
        useState(
            now.getMonth() + 1
        );

    const [selectedYear, setSelectedYear] =
        useState(
            now.getFullYear()
        );
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] =
        useState("ALL");

    const [classes, setClasses] =
        useState<string[]>([
            "ALL",
        ]);

    const fetchClasses =
        async () => {
            const {
                data,
                error,
            } =
                await getClasses();

            if (error) {
                console.log(error);

                return;
            }

            setClasses(data);
        };

    const fetchReports =
        async () => {
            try {
                setLoading(true);

                const {
                    data,
                    error,
                } =
                    await getReportData({
                        selectedClass,
                    });

                if (
                    error ||
                    !data
                ) {
                    console.log(
                        error
                    );

                    return;
                }

                // SUMMARY
                const summaryData =
                    generateReportSummary(
                        {
                            students:
                                data.students,

                            feeAssignments:
                                data.feeAssignments,

                            transactions:
                                data.transactions,

                            selectedMonth,

                            selectedYear,
                        }
                    );

                setSummary(
                    summaryData
                );

                // DETAILED REPORT
                const detailedRows =
                    generateDetailedReport(
                        {
                            students:
                                data.students,

                            feeAssignments:
                                data.feeAssignments,

                            transactions:
                                data.transactions,

                            selectedMonth,

                            selectedYear,
                        }
                    );

                setReportRows(
                    detailedRows
                );
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

    useFocusEffect(
        useCallback(() => {
            fetchClasses();

            fetchReports();
        }, [selectedClass, selectedMonth, selectedYear])
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-3 text-sm text-slate-400">Generating report...</Text>
            </SafeAreaView>
        );
    }

    const collectionRate = summary?.totalStudents > 0
        ? Math.round((summary.totalCollection / (summary.totalCollection + summary.totalPending)) * 100) || 0
        : 0;

    return (
        <ScreenWrapper>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: 40,
                }}
            >
                {/* Header */}
                <Text className="mb-1 text-2xl font-bold text-white">Reports</Text>
                <Text className="mb-6 text-sm text-slate-400">Financial overview across all students</Text>

                <View className="mb-5 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                    <Picker
                        selectedValue={
                            selectedClass
                        }
                        dropdownIconColor="#fff"
                        style={{
                            color: "white",
                        }}
                        onValueChange={(
                            value
                        ) =>
                            setSelectedClass(
                                value
                            )
                        }
                    >
                        {classes.map((item) => (
                            <Picker.Item
                                key={item}
                                label={item}
                                value={item}
                            />
                        ))}
                    </Picker>
                </View>

                <View className="mb-5 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                    <Picker
                        selectedValue={
                            selectedMonth
                        }
                        dropdownIconColor="#fff"
                        style={{
                            color: "white",
                        }}
                        onValueChange={(
                            value
                        ) =>
                            setSelectedMonth(
                                value
                            )
                        }
                    >
                        <Picker.Item
                            label="January"
                            value={1}
                        />

                        <Picker.Item
                            label="February"
                            value={2}
                        />

                        <Picker.Item
                            label="March"
                            value={3}
                        />

                        <Picker.Item
                            label="April"
                            value={4}
                        />

                        <Picker.Item
                            label="May"
                            value={5}
                        />

                        <Picker.Item
                            label="June"
                            value={6}
                        />

                        <Picker.Item
                            label="July"
                            value={7}
                        />

                        <Picker.Item
                            label="August"
                            value={8}
                        />

                        <Picker.Item
                            label="September"
                            value={9}
                        />

                        <Picker.Item
                            label="October"
                            value={10}
                        />

                        <Picker.Item
                            label="November"
                            value={11}
                        />

                        <Picker.Item
                            label="December"
                            value={12}
                        />
                    </Picker>
                </View>

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
                    className="mb-5 rounded-2xl bg-indigo-600 py-4"
                >
                    <Text className="text-center text-base font-bold text-white">
                        Download Report PDF
                    </Text>
                </Pressable>

                {/* Collection Rate Banner */}
                <View className="mb-6 overflow-hidden rounded-2xl bg-indigo-600 p-5">
                    <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-200">
                        Collection Rate
                    </Text>
                    <Text className="text-5xl font-bold text-white">{collectionRate}%</Text>
                    <Text className="mt-1 text-sm text-indigo-200">of expected fees collected</Text>

                    {/* Progress Bar */}
                    <View className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-800">
                        <View
                            className="h-2 rounded-full bg-white"
                            style={{ width: `${collectionRate}%` }}
                        />
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row gap-3">
                    <View className="flex-1">
                        <View className="mb-3 rounded-2xl bg-slate-800 p-4">
                            <Text className="text-2xl">🎓</Text>
                            <Text className="mt-2 text-2xl font-bold text-white">{summary?.totalStudents}</Text>
                            <Text className="mt-0.5 text-xs text-slate-400">Total Students</Text>
                        </View>
                        <View className="rounded-2xl bg-red-950 border border-red-900 p-4">
                            <Text className="text-2xl">⚠️</Text>
                            <Text className="mt-2 text-2xl font-bold text-red-400">{summary?.defaultersCount}</Text>
                            <Text className="mt-0.5 text-xs text-slate-400">Defaulters</Text>
                        </View>
                    </View>
                    <View className="flex-1">
                        <View className="mb-3 rounded-2xl bg-green-950 border border-green-900 p-4">
                            <Text className="text-2xl">✅</Text>
                            <Text className="mt-2 text-xl font-bold text-green-400">₹{summary?.totalCollection?.toLocaleString()}</Text>
                            <Text className="mt-0.5 text-xs text-slate-400">Collected</Text>
                        </View>
                        <View className="rounded-2xl bg-yellow-950 border border-yellow-900 p-4">
                            <Text className="text-2xl">🕒</Text>
                            <Text className="mt-2 text-xl font-bold text-yellow-400">₹{summary?.totalPending?.toLocaleString()}</Text>
                            <Text className="mt-0.5 text-xs text-slate-400">Pending</Text>
                        </View>
                    </View>
                </View>

                {/* Advance */}
                {summary?.totalAdvance > 0 && (
                    <View className="mt-3 rounded-2xl bg-slate-800 p-5">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-sm text-slate-400">Advance Amount</Text>
                                <Text className="mt-1 text-2xl font-bold text-indigo-400">
                                    ₹{summary?.totalAdvance?.toLocaleString()}
                                </Text>
                            </View>
                            <Text className="text-3xl">💎</Text>
                        </View>
                        <Text className="mt-2 text-xs text-slate-500">
                            Collected in advance from students
                        </Text>
                    </View>
                )}

                {/* Summary table */}
                <View className="mt-4 rounded-2xl bg-slate-800 p-5">
                    <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Breakdown</Text>
                    {[
                        { label: "Total Students", value: summary?.totalStudents },
                        { label: "Total Collected", value: `₹${summary?.totalCollection?.toLocaleString()}` },
                        { label: "Total Pending", value: `₹${summary?.totalPending?.toLocaleString()}` },
                        { label: "Advance Balance", value: `₹${summary?.totalAdvance?.toLocaleString()}` },
                        { label: "Defaulters", value: summary?.defaultersCount },
                    ].map((row, i, arr) => (
                        <View
                            key={i}
                            className={`flex-row items-center justify-between py-3 ${i < arr.length - 1 ? "border-b border-slate-700" : ""}`}
                        >
                            <Text className="text-sm text-slate-400">{row.label}</Text>
                            <Text className="font-bold text-white">{row.value}</Text>
                        </View>
                    ))}
                </View>

                <View className="mt-5 flex-1 rounded-2xl bg-slate-800 p-4">
                    {/* Header */}
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-white">
                            Student Reports
                        </Text>

                        <Text className="text-xs text-slate-400">
                            {reportRows.length} Students
                        </Text>
                    </View>

                    {/* Table Header */}
                    <View className="mb-2 flex-row border-b border-slate-700 pb-2">
                        <Text className="flex-1 text-xs font-bold text-slate-400">
                            Student
                        </Text>

                        <Text className="w-20 text-right text-xs font-bold text-slate-400">
                            Paid
                        </Text>

                        <Text className="w-20 text-right text-xs font-bold text-slate-400">
                            Pending
                        </Text>
                    </View>

                    {/* FlatList */}
                    <FlatList
                        data={reportRows}
                        keyExtractor={(item) =>
                            item.studentId
                        }
                        nestedScrollEnabled
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View className="flex-row items-center border-b border-slate-700 py-3">
                                {/* Student */}
                                <View className="flex-1">
                                    <Text
                                        numberOfLines={1}
                                        className="font-semibold text-white"
                                    >
                                        {
                                            item.studentName
                                        }
                                    </Text>

                                    <Text className="text-xs text-slate-500">
                                        {
                                            item.className
                                        }
                                    </Text>
                                </View>

                                {/* Paid */}
                                <Text className="w-20 text-right text-sm font-bold text-green-400">
                                    ₹
                                    {item.paid}
                                </Text>

                                {/* Pending */}
                                <Text
                                    className={`w-20 text-right text-sm font-bold ${item.pending >
                                        0
                                        ? "text-red-400"
                                        : "text-indigo-400"
                                        }`}
                                >
                                    {item.pending >
                                        0
                                        ? `₹${item.pending}`
                                        : "Paid"}
                                </Text>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View className="py-10">
                                <Text className="text-center text-slate-400">
                                    No students found
                                </Text>
                            </View>
                        }
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}