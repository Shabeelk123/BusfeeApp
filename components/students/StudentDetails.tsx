import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";
import ConfirmDialog from "../common/ConfirmDialog";
import { useToast } from "../common/ToastContext";

import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";

import { deleteStudent, getStudentById } from "../../services/student.service";
import { calculateFeeBalance } from "../../utils/fee";
import { generateMonthlyFeeStatus } from "../../utils/monthlyFeeStatus";

interface Props {
    role:
    | "ADMIN"
    | "TEACHER";

    baseRoute:
    | "/(admin)"
    | "/(teacher)";
}

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function StudentDetailsScreen({ role, baseRoute }: Props) {
    const toast = useToast();
    const { id } = useLocalSearchParams();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"info" | "monthly" | "transactions">("info");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const { data } = await getStudentById(id as string);
            if (data) setStudent(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchStudent(); }, []));

    const handleDelete = async () => {
        const { error } = await deleteStudent(student.id);
        if (error) {
            toast.error("Delete Failed", error.message);
            return;
        }
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-3 text-sm text-slate-400">Loading profile...</Text>
            </SafeAreaView>
        );
    }

    if (!student) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
                <Text className="text-5xl">❓</Text>
                <Text className="mt-4 text-lg text-slate-400">Student not found</Text>
                <Pressable onPress={() => router.back()} className="mt-4">
                    <Text className="text-indigo-400">← Go back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const monthlyFee = student?.student_fee_assignments?.[0]?.monthly_fee || 0;
    const feeSummary = calculateFeeBalance({
        monthlyFee,
        transactions: student?.fee_transactions || [],
        joinDate: student.created_at,
    });
    const monthlyStatus = generateMonthlyFeeStatus({
        monthlyFee,
        joinDate: student.created_at,
        transactions: student?.fee_transactions || [],
    });

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
            >
                {/* Header */}
                <View className="px-5 pt-6">
                    <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center">
                        <Text className="text-indigo-400">← Back</Text>
                    </Pressable>

                    {/* Profile Card */}
                    <View className="mb-5 rounded-2xl bg-indigo-600 p-5">
                        <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-white/20">
                            <Text className="text-3xl">🎓</Text>
                        </View>
                        <Text className="text-2xl font-bold text-white">{student.full_name}</Text>
                        <Text className="mt-1 text-sm text-indigo-200">#{student.admission_no}</Text>
                        <View className="mt-3 flex-row gap-3">
                            <View className="rounded-lg bg-white/20 px-3 py-1">
                                <Text className="text-xs text-white">{student.class_name || "No Class"}</Text>
                            </View>
                            <View className="rounded-lg bg-white/20 px-3 py-1">
                                <Text className="text-xs text-white">🚌 {student.bus_route || "No Route"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Fee Summary Row */}
                    <View className="mb-5 flex-row gap-3">
                        <View className="flex-1 rounded-xl bg-slate-800 p-4">
                            <Text className="text-xs text-slate-400">Monthly Fee</Text>
                            <Text className="mt-1 text-xl font-bold text-indigo-400">₹{monthlyFee}</Text>
                        </View>
                        <View className="flex-1 rounded-xl bg-slate-800 p-4">
                            <Text className="text-xs text-slate-400">Total Paid</Text>
                            <Text className="mt-1 text-xl font-bold text-green-400">₹{feeSummary.totalPaid}</Text>
                        </View>
                        <View className={`flex-1 rounded-xl p-4 ${feeSummary.dueAmount > 0 ? "bg-red-950" : "bg-green-950"}`}>
                            <Text className="text-xs text-slate-400">
                                {feeSummary.dueAmount > 0 ? "Due" : "Advance"}
                            </Text>
                            <Text className={`mt-1 text-xl font-bold ${feeSummary.dueAmount > 0 ? "text-red-400" : "text-green-400"}`}>
                                ₹{feeSummary.dueAmount > 0 ? feeSummary.dueAmount : feeSummary.advanceAmount}
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <Pressable
                        onPress={() =>
                            router.push({
                                pathname:
                                    `${baseRoute}/students/add-payment` as any,

                                params: {
                                    studentId:
                                        student.id,
                                },
                            })
                        }
                        className="mb-4 items-center rounded-xl bg-green-600 py-4"
                    >
                        <Text className="font-semibold text-white">
                            Add Payment
                        </Text>
                    </Pressable>

                    {role === "ADMIN" && (
                        <View className="mb-5 flex-row gap-3">
                            <Pressable
                                onPress={() =>
                                    router.push({
                                        pathname: "/(admin)/students/edit",
                                        params: { id: student.id },
                                    })
                                }
                                className="flex-1 items-center rounded-xl bg-slate-700 py-3 active:opacity-80"
                            >
                                <Text className="font-semibold text-blue-400">✏️ Edit</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setShowDeleteDialog(true)}
                                className="flex-1 items-center rounded-xl bg-red-950 py-3 active:opacity-80"
                            >
                                <Text className="font-semibold text-red-400">🗑 Delete</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Tabs */}
                    <View className="mb-5 flex-row rounded-xl bg-slate-800 p-1">
                        {(["info", "monthly", "transactions"] as const).map((tab) => (
                            <Pressable
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className={`flex-1 items-center rounded-lg py-2.5 ${activeTab === tab ? "bg-indigo-600" : ""}`}
                            >
                                <Text className={`text-xs font-semibold capitalize ${activeTab === tab ? "text-white" : "text-slate-400"}`}>
                                    {tab === "info" ? "Info" : tab === "monthly" ? "Monthly" : "Payments"}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Tab Content */}
                <View className="px-5">
                    {/* Info Tab */}
                    {activeTab === "info" && (
                        <View className="rounded-2xl bg-slate-800 p-5">
                            {[
                                { label: "Parent Name", value: student.parent_name, emoji: "👨‍👩‍👧" },
                                { label: "Phone", value: student.phone, emoji: "📞" },
                                { label: "Class", value: student.class_name, emoji: "📚" },
                                { label: "Bus Route", value: student.bus_route, emoji: "🚌" },
                                { label: "Expected Total", value: `₹${feeSummary.expectedAmount}`, emoji: "💰" },
                                { label: "Months Enrolled", value: `${feeSummary.totalMonths} months`, emoji: "📅" },
                            ].map((item, i) => (
                                <View key={i} className={`flex-row items-center py-3 ${i < 5 ? "border-b border-slate-700" : ""}`}>
                                    <Text className="mr-3 text-base">{item.emoji}</Text>
                                    <View className="flex-1">
                                        <Text className="text-xs text-slate-500">{item.label}</Text>
                                        <Text className="mt-0.5 text-sm text-slate-200">{item.value || "—"}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Monthly Status Tab */}
                    {activeTab === "monthly" && (
                        <View>
                            {monthlyStatus.months.map((item, index) => (
                                <View
                                    key={index}
                                    className={`mb-3 flex-row items-center rounded-xl p-4 ${item.status === "PAID"
                                        ? "bg-green-950 border border-green-800"
                                        : item.status === "PARTIAL"
                                            ? "bg-orange-950 border border-orange-800"
                                            : "bg-red-950 border border-red-900"
                                        }`}
                                >
                                    <View className="flex-1">
                                        <Text className="font-bold text-white">
                                            {MONTH_NAMES[item.month - 1]} {item.year}
                                        </Text>
                                        <Text className="mt-1 text-xs text-slate-400">
                                            Paid ₹{item.paid} / ₹{item.expected}
                                        </Text>
                                    </View>
                                    <View className={`rounded-full px-3 py-1 ${item.status === "PAID"
                                        ? "bg-green-700"
                                        : item.status === "PARTIAL"
                                            ? "bg-orange-700"
                                            : "bg-red-700"
                                        }`}>
                                        <Text className="text-xs font-bold text-white">{item.status}</Text>
                                    </View>
                                </View>
                            ))}
                            {monthlyStatus.advanceAmount > 0 && (
                                <View className="mt-2 rounded-xl bg-indigo-950 border border-indigo-700 p-4">
                                    <Text className="font-bold text-indigo-400">
                                        🎉 Advance Balance: ₹{monthlyStatus.advanceAmount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === "transactions" && (
                        <View>
                            {!student?.fee_transactions?.length ? (
                                <View className="mt-10 items-center">
                                    <Text className="text-4xl">💳</Text>
                                    <Text className="mt-4 text-slate-400">No transactions yet</Text>
                                </View>
                            ) : (
                                student.fee_transactions.map((item: any) => (
                                    <View
                                        key={item.id}
                                        className="mb-3 rounded-xl bg-slate-800 p-4"
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-lg font-bold text-green-400">₹{item.amount}</Text>
                                            <Text className="text-xs text-slate-500">
                                                {MONTH_NAMES[(item.payment_month || 1) - 1]} {item.payment_year}
                                            </Text>
                                        </View>
                                        {item.note ? (
                                            <Text className="mt-1 text-xs text-slate-400">{item.note}</Text>
                                        ) : null}
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <ConfirmDialog
                visible={showDeleteDialog}
                variant="danger"
                title="Delete Student"
                subtitle="This will permanently remove the student and all associated fee records. This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </SafeAreaView>
    );
}