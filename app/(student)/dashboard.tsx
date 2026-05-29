import { logoutUser } from "@/services/auth.service";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";
import { getCurrentStudent } from "../../services/student.service";
import { calculateFeeBalance } from "../../utils/fee";
import { generateMonthlyFeeStatus } from "../../utils/monthlyFeeStatus";

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
    return (
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
            <Text className="mb-1 text-xs text-slate-500">{label}</Text>
            <Text className={`text-lg font-bold ${valueColor}`}>{value}</Text>
        </View>
    );
}

export default function StudentDashboard() {
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"monthly" | "history">("monthly");

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const { data, error } = await getCurrentStudent();
            if (error) { console.log(error); return; }
            setStudent(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await logoutUser();
        if (error) { Alert.alert("Error", error.message); return; }
        router.replace("/(auth)/login");
    };

    useFocusEffect(useCallback(() => { fetchStudent(); }, []));

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-3 text-sm text-slate-400">Loading your account...</Text>
            </SafeAreaView>
        );
    }

    if (!student) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
                <View className="items-center px-8">
                    <Text className="text-5xl">🔒</Text>
                    <Text className="mt-4 text-center text-lg font-bold text-white">Profile Not Found</Text>
                    <Text className="mt-2 text-center text-sm text-slate-400">
                        Please contact your school administrator to set up your account.
                    </Text>
                    <Pressable onPress={handleLogout} className="mt-6 rounded-xl bg-slate-800 px-6 py-3">
                        <Text className="font-semibold text-red-400">Sign Out</Text>
                    </Pressable>
                </View>
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

    const paidCount = monthlyStatus.months.filter(m => m.status === "PAID").length;
    const pendingCount = monthlyStatus.months.filter(m => m.status === "PENDING").length;
    const isCleared = feeSummary.dueAmount === 0;

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
            >
                {/* ── Header ── */}
                <View className="px-5 pt-6">
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                            <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Student Portal
                            </Text>
                            <Text className="mt-1 text-2xl font-bold text-white" numberOfLines={1}>
                                {student.full_name}
                            </Text>
                            <View className="mt-2 flex-row gap-2">
                                <View className="rounded-lg bg-slate-800 px-3 py-1">
                                    <Text className="text-xs font-medium text-slate-300">
                                        📚 {student.class_name || "No Class"}
                                    </Text>
                                </View>
                                <View className="rounded-lg bg-slate-800 px-3 py-1">
                                    <Text className="text-xs font-medium text-slate-300">
                                        🚌 {student.bus_route || "No Route"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <Pressable
                            onPress={handleLogout}
                            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                            className="ml-3 rounded-xl bg-slate-800 px-4 py-2"
                        >
                            <Text className="text-sm font-semibold text-red-400">Logout</Text>
                        </Pressable>
                    </View>
                </View>

                {/* ── Fee Status Hero Banner ── */}
                <View className="mx-5 mt-5">
                    <View className={`overflow-hidden rounded-2xl p-5 ${isCleared ? "bg-emerald-700" : "bg-red-800"}`}>
                        <Text className="text-xs font-bold uppercase tracking-widest text-white/60">
                            {isCleared ? "Account Status" : "Outstanding Balance"}
                        </Text>
                        <Text className="mt-2 text-4xl font-bold text-white">
                            {feeSummary.dueAmount > 0
                                ? `₹${feeSummary.dueAmount}`
                                : feeSummary.advanceAmount > 0
                                    ? `+₹${feeSummary.advanceAmount}`
                                    : "All Clear"}
                        </Text>
                        <Text className="mt-1 text-sm text-white/70">
                            {feeSummary.dueAmount > 0
                                ? "Please clear your dues as soon as possible"
                                : feeSummary.advanceAmount > 0
                                    ? "You have an advance balance — great work!"
                                    : "Your fee account is fully up to date"}
                        </Text>

                        {/* Mini badges */}
                        <View className="mt-4 flex-row gap-2">
                            <View className="rounded-lg bg-white/10 px-3 py-1.5">
                                <Text className="text-xs font-bold text-white">{paidCount} Paid</Text>
                            </View>
                            {pendingCount > 0 && (
                                <View className="rounded-lg bg-white/10 px-3 py-1.5">
                                    <Text className="text-xs font-bold text-white">{pendingCount} Pending</Text>
                                </View>
                            )}
                            {monthlyStatus.advanceAmount > 0 && (
                                <View className="rounded-lg bg-white/10 px-3 py-1.5">
                                    <Text className="text-xs font-bold text-white">₹{monthlyStatus.advanceAmount} Advance</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* ── Stats Row ── */}
                <View className="mx-5 mt-4 flex-row gap-3">
                    <StatCard label="Monthly Fee" value={`₹${monthlyFee}`} valueColor="text-indigo-400" />
                    <StatCard label="Total Paid" value={`₹${feeSummary.totalPaid}`} valueColor="text-emerald-400" />
                    <StatCard label="Months" value={String(feeSummary.totalMonths)} valueColor="text-white" />
                </View>

                {/* ── Tabs ── */}
                <View className="mx-5 mt-6 flex-row rounded-xl bg-slate-800 p-1">
                    {(["monthly", "history"] as const).map((tab) => (
                        <Pressable
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                            className={`flex-1 items-center rounded-lg py-2.5 ${activeTab === tab ? "bg-indigo-600" : ""}`}
                        >
                            <Text className={`text-sm font-semibold ${activeTab === tab ? "text-white" : "text-slate-400"}`}>
                                {tab === "monthly" ? "Monthly" : "History"}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* ── Monthly Status Tab ── */}
                {activeTab === "monthly" && (
                    <View className="mx-5 mt-4">
                        {monthlyStatus.months.length === 0 ? (
                            <View className="mt-10 items-center">
                                <Text className="text-4xl">📅</Text>
                                <Text className="mt-3 text-slate-400">No monthly records yet</Text>
                            </View>
                        ) : (
                            monthlyStatus.months.map((item, index) => {
                                const isPaid = item.status === "PAID";
                                const isPartial = item.status === "PARTIAL";
                                return (
                                    <View
                                        key={index}
                                        className={`mb-2.5 flex-row items-center rounded-xl px-4 py-3.5 ${
                                            isPaid ? "bg-emerald-950 border border-emerald-800"
                                            : isPartial ? "bg-orange-950 border border-orange-800"
                                            : "bg-red-950 border border-red-900"
                                        }`}
                                    >
                                        <View className="flex-1">
                                            <Text className="font-semibold text-white">
                                                {MONTH_NAMES[item.month - 1]} {item.year}
                                            </Text>
                                            <Text className="mt-0.5 text-xs text-slate-400">
                                                Paid ₹{item.paid} of ₹{item.expected}
                                            </Text>
                                        </View>
                                        <View className={`rounded-full px-3 py-1 ${
                                            isPaid ? "bg-emerald-700" : isPartial ? "bg-orange-700" : "bg-red-700"
                                        }`}>
                                            <Text className="text-xs font-bold text-white">{item.status}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                {/* ── History Tab ── */}
                {activeTab === "history" && (
                    <View className="mx-5 mt-4">
                        {!student?.fee_transactions?.length ? (
                            <View className="mt-10 items-center">
                                <Text className="text-4xl">💳</Text>
                                <Text className="mt-3 text-slate-400">No payments recorded yet</Text>
                            </View>
                        ) : (
                            [...student.fee_transactions]
                                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((item: any) => (
                                    <View key={item.id} className="mb-3 rounded-xl bg-slate-800 p-4">
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center">
                                                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-emerald-900">
                                                    <Text className="text-base">₹</Text>
                                                </View>
                                                <View>
                                                    <Text className="text-base font-bold text-emerald-400">₹{item.amount}</Text>
                                                    <Text className="text-xs text-slate-500">
                                                        {MONTH_NAMES[(item.payment_month || 1) - 1]} {item.payment_year}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-xs text-slate-600">
                                                {new Date(item.created_at).toLocaleDateString("en-IN")}
                                            </Text>
                                        </View>
                                        {item.note ? (
                                            <Text className="mt-2.5 border-t border-slate-700 pt-2.5 text-xs text-slate-500">
                                                {item.note}
                                            </Text>
                                        ) : null}
                                    </View>
                                ))
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}