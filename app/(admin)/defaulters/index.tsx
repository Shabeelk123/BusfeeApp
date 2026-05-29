import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";

import {
    useCallback,
    useState,
} from "react";

import { Picker } from "@react-native-picker/picker";

import { useFocusEffect } from "@react-navigation/native";

import ScreenWrapper from "@/components/common/ScreenWrapper";
import { getClasses } from "@/services/class.service";
import { downloadReportPdf } from "@/services/report-pdf.service";
import { getReportData } from "@/services/report.service";
import { generateDetailedReport } from "@/utils/generateDetailedReport";
import { generateReportSummary } from "@/utils/report";

export default function ReportsScreen() {
    const now =
        new Date();

    const [loading, setLoading] =
        useState(true);

    const [summary, setSummary] =
        useState<any>(null);

    const [reportRows, setReportRows] =
        useState<any[]>([]);

    const [selectedClass, setSelectedClass] =
        useState("ALL");

    const [classes, setClasses] =
        useState<string[]>([
            "ALL",
        ]);

    const [selectedMonth, setSelectedMonth] =
        useState(
            now.getMonth() + 1
        );

    const [selectedYear] =
        useState(
            now.getFullYear()
        );

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

                // DETAILED
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
        }, [
            selectedClass,
            selectedMonth,
        ])
    );

    if (loading) {
        return (
            <ScreenWrapper backgroundColor="#020617">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator
                        size="large"
                        color="#6366F1"
                    />

                    <Text className="mt-3 text-sm text-slate-400">
                        Generating
                        report...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor="#020617">
            <FlatList
                data={reportRows}
                keyExtractor={(
                    item
                ) =>
                    item.studentId
                }
                showsVerticalScrollIndicator={
                    false
                }
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: 40,
                }}
                ListHeaderComponent={
                    <>
                        {/* Header */}
                        <Text className="text-4xl font-black text-white">
                            Reports
                        </Text>

                        <Text className="mt-2 text-base text-slate-400">
                            Financial
                            overview
                            across all
                            students
                        </Text>

                        {/* Class Filter */}
                        <View className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                            <Picker
                                selectedValue={
                                    selectedClass
                                }
                                dropdownIconColor="#fff"
                                style={{
                                    color:
                                        "white",
                                }}
                                onValueChange={(
                                    value
                                ) =>
                                    setSelectedClass(
                                        value
                                    )
                                }
                            >
                                {classes.map(
                                    (
                                        item
                                    ) => (
                                        <Picker.Item
                                            key={
                                                item
                                            }
                                            label={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        />
                                    )
                                )}
                            </Picker>
                        </View>

                        {/* Month Filter */}
                        <View className="mt-4 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                            <Picker
                                selectedValue={
                                    selectedMonth
                                }
                                dropdownIconColor="#fff"
                                style={{
                                    color:
                                        "white",
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
                                    value={
                                        1
                                    }
                                />

                                <Picker.Item
                                    label="February"
                                    value={
                                        2
                                    }
                                />

                                <Picker.Item
                                    label="March"
                                    value={
                                        3
                                    }
                                />

                                <Picker.Item
                                    label="April"
                                    value={
                                        4
                                    }
                                />

                                <Picker.Item
                                    label="May"
                                    value={
                                        5
                                    }
                                />

                                <Picker.Item
                                    label="June"
                                    value={
                                        6
                                    }
                                />

                                <Picker.Item
                                    label="July"
                                    value={
                                        7
                                    }
                                />

                                <Picker.Item
                                    label="August"
                                    value={
                                        8
                                    }
                                />

                                <Picker.Item
                                    label="September"
                                    value={
                                        9
                                    }
                                />

                                <Picker.Item
                                    label="October"
                                    value={
                                        10
                                    }
                                />

                                <Picker.Item
                                    label="November"
                                    value={
                                        11
                                    }
                                />

                                <Picker.Item
                                    label="December"
                                    value={
                                        12
                                    }
                                />
                            </Picker>
                        </View>

                        {/* Download */}
                        <Pressable
                            onPress={() =>
                                downloadReportPdf(
                                    {
                                        reportRows,

                                        summary,

                                        selectedClass,

                                        selectedMonth,

                                        selectedYear,
                                    }
                                )
                            }
                            className="mt-5 rounded-2xl bg-indigo-600 py-4"
                        >
                            <Text className="text-center text-base font-bold text-white">
                                Download
                                PDF
                            </Text>
                        </Pressable>

                        {/* Collection Banner */}
                        <View className="mt-6 overflow-hidden rounded-3xl bg-indigo-600 p-5">
                            <Text className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                                Collection
                                Rate
                            </Text>

                            <Text className="mt-2 text-5xl font-black text-white">
                                {
                                    summary?.collectionRate
                                }
                                %
                            </Text>

                            <Text className="mt-2 text-sm text-indigo-200">
                                of expected
                                fees
                                collected
                            </Text>

                            <View className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-800">
                                <View
                                    className="h-2 rounded-full bg-white"
                                    style={{
                                        width: `${summary?.collectionRate}%`,
                                    }}
                                />
                            </View>
                        </View>

                        {/* Stats */}
                        <View className="mt-5 flex-row flex-wrap justify-between">
                            <View className="mb-4 w-[48%] rounded-3xl bg-slate-800 p-5">
                                <Text className="text-2xl">
                                    🎓
                                </Text>

                                <Text className="mt-3 text-3xl font-black text-white">
                                    {
                                        summary?.totalStudents
                                    }
                                </Text>

                                <Text className="mt-1 text-sm text-slate-400">
                                    Students
                                </Text>
                            </View>

                            <View className="mb-4 w-[48%] rounded-3xl bg-green-950 p-5">
                                <Text className="text-2xl">
                                    💰
                                </Text>

                                <Text className="mt-3 text-3xl font-black text-green-400">
                                    ₹
                                    {
                                        summary?.totalCollection
                                    }
                                </Text>

                                <Text className="mt-1 text-sm text-slate-400">
                                    Collected
                                </Text>
                            </View>

                            <View className="w-[48%] rounded-3xl bg-red-950 p-5">
                                <Text className="text-2xl">
                                    ⚠️
                                </Text>

                                <Text className="mt-3 text-3xl font-black text-red-400">
                                    ₹
                                    {
                                        summary?.totalPending
                                    }
                                </Text>

                                <Text className="mt-1 text-sm text-slate-400">
                                    Pending
                                </Text>
                            </View>

                            <View className="w-[48%] rounded-3xl bg-indigo-950 p-5">
                                <Text className="text-2xl">
                                    📌
                                </Text>

                                <Text className="mt-3 text-3xl font-black text-indigo-400">
                                    {
                                        summary?.defaultersCount
                                    }
                                </Text>

                                <Text className="mt-1 text-sm text-slate-400">
                                    Defaulters
                                </Text>
                            </View>
                        </View>

                        {/* Table Header */}
                        <View className="mt-8 mb-2 flex-row border-b border-slate-700 pb-3">
                            <Text className="flex-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                                Student
                            </Text>

                            <Text className="w-20 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                                Paid
                            </Text>

                            <Text className="w-20 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                                Pending
                            </Text>
                        </View>
                    </>
                }
                renderItem={({
                    item,
                }) => (
                    <View className="flex-row items-center border-b border-slate-800 py-4">
                        {/* Student */}
                        <View className="flex-1">
                            <Text
                                numberOfLines={
                                    1
                                }
                                className="font-semibold text-white"
                            >
                                {
                                    item.studentName
                                }
                            </Text>

                            <Text className="mt-1 text-xs text-slate-500">
                                {
                                    item.className
                                }
                            </Text>
                        </View>

                        {/* Paid */}
                        <Text className="w-20 text-right text-sm font-bold text-green-400">
                            ₹
                            {
                                item.paid
                            }
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
                    <View className="py-20">
                        <Text className="text-center text-slate-500">
                            No reports
                            found
                        </Text>
                    </View>
                }
            />
        </ScreenWrapper>
    );
}