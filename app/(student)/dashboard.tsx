import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View
} from "react-native";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { logoutUser } from "../../services/auth.service";
import { getCurrentStudent } from "../../services/student.service";
import { calculateFeeBalance } from "../../utils/fee";
import { generateMonthlyFeeStatus } from "../../utils/monthlyFeeStatus";

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function MiniStat({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
    return (
        <View
            className="flex-1 rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
        >
            <Text className="mb-1 text-xs text-gray-400">{label}</Text>
            <Text className={`text-base font-bold ${valueColor}`}>{value}</Text>
        </View>
    );
}

export default function StudentDashboard() {
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"monthly" | "history">("monthly");
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const { data } = await getCurrentStudent();
            setStudent(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutUser();
        router.replace("/(auth)/login");
    };

    useFocusEffect(useCallback(() => { fetchStudent(); }, []));

    if (loading) {
        return (
            <ScreenWrapper>
                <View className="flex-1 items-center justify-center bg-gray-50">
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text className="mt-3 text-sm text-gray-400">Loading your account…</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!student) {
        return (
            <ScreenWrapper>
                <View className="items-center px-8">
                    <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                        <Ionicons name="lock-closed" size={40} color="#6B7280" />
                    </View>
                    <Text className="mt-4 text-center text-lg font-bold text-gray-900">Profile Not Found</Text>
                    <Text className="mt-2 text-center text-sm text-gray-500">
                        Please contact your school administrator to set up your account.
                    </Text>
                    <Pressable
                        onPress={() => setShowLogoutDialog(true)}
                        className="mt-6 flex-row items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-3"
                    >
                        <Ionicons name="log-out-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                        <Text className="font-semibold text-red-500">Sign Out</Text>
                    </Pressable>
                </View>
            </ScreenWrapper>
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
        <ScreenWrapper>
            <ScrollView
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View className="mb-6 flex-row items-start justify-between">
                    <View className="flex-1">
                        <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                            Student Portal
                        </Text>
                        <Text className="mt-1 text-2xl font-bold text-gray-900" numberOfLines={1}>
                            {student.full_name}
                        </Text>
                        <View className="mt-2 flex-row gap-2">
                            <View className="flex-row items-center rounded-lg border border-gray-200 bg-white px-3 py-1">
                                <Ionicons name="book-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                                <Text className="text-xs font-medium text-gray-600">{student.class_name || "No Class"}</Text>
                            </View>
                            <View className="flex-row items-center rounded-lg border border-gray-200 bg-white px-3 py-1">
                                <Ionicons name="bus-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                                <Text className="text-xs font-medium text-gray-600">{student.bus_route || "No Route"}</Text>
                            </View>
                        </View>
                    </View>
                    <Pressable
                        onPress={() => setShowLogoutDialog(true)}
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                        className="ml-3 flex-row items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2"
                    >
                        <Ionicons name="log-out-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                        <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
                    </Pressable>
                </View>

                {/* ── Fee Status Hero Banner ── */}
                <View
                    className={`mb-5 overflow-hidden rounded-3xl p-6 ${isCleared ? "bg-emerald-600" : "bg-red-500"}`}
                    style={{ shadowColor: isCleared ? "#059669" : "#ef4444", shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 }}
                >
                    <Text className="text-xs font-bold uppercase tracking-widest text-white/70">
                        {isCleared ? "Account Status" : "Outstanding Balance"}
                    </Text>
                    <Text className="mt-2 text-4xl font-black text-white">
                        {feeSummary.dueAmount > 0
                            ? `₹${feeSummary.dueAmount}`
                            : feeSummary.advanceAmount > 0
                                ? `+₹${feeSummary.advanceAmount}`
                                : "All Clear"}
                    </Text>
                    <Text className="mt-1 text-sm text-white/80">
                        {feeSummary.dueAmount > 0
                            ? "Please clear your dues as soon as possible"
                            : feeSummary.advanceAmount > 0
                                ? "You have an advance balance — great work!"
                                : "Your fee account is fully up to date"}
                    </Text>
                    <View className="mt-4 flex-row gap-2">
                        <View className="flex-row items-center rounded-lg bg-white/20 px-3 py-1.5">
                            <Ionicons name="checkmark-circle-outline" size={12} color="white" style={{ marginRight: 4 }} />
                            <Text className="text-xs font-bold text-white">{paidCount} Paid</Text>
                        </View>
                        {pendingCount > 0 && (
                            <View className="flex-row items-center rounded-lg bg-white/20 px-3 py-1.5">
                                <Ionicons name="time-outline" size={12} color="white" style={{ marginRight: 4 }} />
                                <Text className="text-xs font-bold text-white">{pendingCount} Pending</Text>
                            </View>
                        )}
                        {monthlyStatus.advanceAmount > 0 && (
                            <View className="flex-row items-center rounded-lg bg-white/20 px-3 py-1.5">
                                <Ionicons name="trending-up-outline" size={12} color="white" style={{ marginRight: 4 }} />
                                <Text className="text-xs font-bold text-white">₹{monthlyStatus.advanceAmount} Advance</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Stats Row ── */}
                <View className="mb-6 flex-row gap-3">
                    <MiniStat label="Monthly Fee" value={`₹${monthlyFee}`} valueColor="text-blue-600" />
                    <MiniStat label="Total Paid" value={`₹${feeSummary.totalPaid}`} valueColor="text-emerald-600" />
                    <MiniStat label="Months" value={String(feeSummary.totalMonths)} valueColor="text-gray-900" />
                </View>

                {/* ── Tabs ── */}
                <View className="mb-5 flex-row rounded-2xl border border-gray-200 bg-white p-1">
                    {(["monthly", "history"] as const).map((tab) => (
                        <Pressable
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                            className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${activeTab === tab ? "bg-blue-600" : ""}`}
                        >
                            <Ionicons
                                name={tab === "monthly" ? "calendar-outline" : "receipt-outline"}
                                size={14}
                                color={activeTab === tab ? "white" : "#9CA3AF"}
                                style={{ marginRight: 5 }}
                            />
                            <Text className={`text-sm font-semibold ${activeTab === tab ? "text-white" : "text-gray-400"}`}>
                                {tab === "monthly" ? "Monthly" : "History"}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* ── Monthly Status Tab ── */}
                {activeTab === "monthly" && (
                    <View>
                        {monthlyStatus.months.length === 0 ? (
                            <View className="mt-10 items-center">
                                <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                    <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
                                </View>
                                <Text className="mt-2 text-gray-400">No monthly records yet</Text>
                            </View>
                        ) : (
                            monthlyStatus.months.map((item, index) => {
                                const isPaid = item.status === "PAID";
                                const isPartial = item.status === "PARTIAL";
                                return (
                                    <View
                                        key={index}
                                        className={`mb-2.5 flex-row items-center rounded-2xl border px-4 py-3.5 ${isPaid
                                            ? "border-emerald-200 bg-emerald-50"
                                            : isPartial
                                                ? "border-orange-200 bg-orange-50"
                                                : "border-red-200 bg-red-50"
                                            }`}
                                    >
                                        <Ionicons
                                            name={isPaid ? "checkmark-circle" : isPartial ? "time" : "alert-circle"}
                                            size={20}
                                            color={isPaid ? "#059669" : isPartial ? "#f97316" : "#ef4444"}
                                            style={{ marginRight: 12 }}
                                        />
                                        <View className="flex-1">
                                            <Text className="font-semibold text-gray-900">
                                                {MONTH_NAMES[item.month - 1]} {item.year}
                                            </Text>
                                            <Text className="mt-0.5 text-xs text-gray-500">
                                                Paid ₹{item.paid} of ₹{item.expected}
                                            </Text>
                                        </View>
                                        <View className={`rounded-full px-3 py-1 ${isPaid ? "bg-emerald-600" : isPartial ? "bg-orange-500" : "bg-red-500"}`}>
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
                    <View>
                        {!student?.fee_transactions?.length ? (
                            <View className="mt-10 items-center">
                                <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                    <Ionicons name="card-outline" size={32} color="#9CA3AF" />
                                </View>
                                <Text className="mt-2 text-gray-400">No payments recorded yet</Text>
                            </View>
                        ) : (
                            [...student.fee_transactions]
                                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((item: any) => (
                                    <View
                                        key={item.id}
                                        className="mb-3 rounded-2xl border border-gray-100 bg-white p-4"
                                        style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center">
                                                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                                                    <Ionicons name="cash-outline" size={20} color="#059669" />
                                                </View>
                                                <View>
                                                    <Text className="text-base font-bold text-emerald-600">₹{item.amount}</Text>
                                                    <Text className="text-xs text-gray-400">
                                                        {MONTH_NAMES[(item.payment_month || 1) - 1]} {item.payment_year}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-xs text-gray-400">
                                                {new Date(item.created_at).toLocaleDateString("en-IN")}
                                            </Text>
                                        </View>
                                        {item.note && (
                                            <Text className="mt-2.5 border-t border-gray-100 pt-2.5 text-xs text-gray-400">
                                                {item.note}
                                            </Text>
                                        )}
                                    </View>
                                ))
                        )}
                    </View>
                )}
            </ScrollView>

            <ConfirmDialog
                visible={showLogoutDialog}
                variant="warning"
                title="Sign Out?"
                subtitle="You'll be returned to the login screen."
                confirmLabel="Sign Out"
                cancelLabel="Stay"
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </ScreenWrapper>
    );
}