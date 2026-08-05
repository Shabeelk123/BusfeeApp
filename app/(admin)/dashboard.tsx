import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import AppDrawer from "@/components/common/AppDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { getRecentTransactions, RecentTransaction } from "@/services/payment.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { clearUser } from "@/store/authSlice";
import { formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { generateReportSummary } from "@/utils/report";

// ─── Design Tokens (Stitch: "High-End Fintech Mobile Admin") ──────────────────
const T = {
    background:             "#fbf8ff",
    surface:                "#ffffff",
    surfaceContainer:       "#eeedf8",
    surfaceContainerLow:    "#f4f2fe",
    primary:                "#1a40c2",
    primaryContainer:       "#3b5bdb",
    onPrimary:              "#ffffff",
    onPrimaryContainer:     "#e2e5ff",
    primaryFixed:           "#dde1ff",
    secondary:              "#505f76",
    onSurface:              "#1a1b23",
    onSurfaceVariant:       "#444654",
    outline:                "#747686",
    outlineVariant:         "#c4c5d6",
    error:                  "#ba1a1a",
    errorContainer:         "#ffdad6",
    success:                "#0d7f4e",
    successLight:           "#d1fae5",
    warning:                "#863700",
    warningLight:           "#ffdbcb",
    info:                   "#505f76",
    infoLight:              "#d0e1fb",
} as const;

const S = StyleSheet.create({
    // Cards
    card: {
        backgroundColor: T.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
        borderWidth: 1,
        borderColor: T.outlineVariant,
    },
    // Section heading
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: T.onSurface,
        letterSpacing: -0.01 * 16,
        marginBottom: 12,
    },
});

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function formatTransactionTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    return sameDay
        ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Counter Tile ─────────────────────────────────────────────────────────────
function CounterTile({
    label,
    value,
    icon,
    iconColor,
    iconBg,
}: {
    label: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <View style={[S.card, { flex: 1 }]}>
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                }}
            >
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <Text numberOfLines={1} style={{ fontSize: 22, fontWeight: "700", color: T.onSurface, letterSpacing: -0.02 * 22 }}>
                {value}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: T.onSurfaceVariant, marginTop: 2, letterSpacing: 0.01 }}>
                {label}
            </Text>
        </View>
    );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({
    icon,
    label,
    onPress,
    accent,
    accentBg,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    accent: string;
    accentBg: string;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                gap: 8,
                opacity: pressed ? 0.7 : 1,
            })}
        >
            <View
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    backgroundColor: accentBg,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={24} color={accent} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: T.onSurfaceVariant, textAlign: "center" }}>
                {label}
            </Text>
        </Pressable>
    );
}

// ─── Recent Payment Row ────────────────────────────────────────────────────────
function PaymentRow({ tx, isLast }: { tx: RecentTransaction; isLast: boolean }) {
    const classLabel = tx.student?.grade && tx.student?.division
        ? `${tx.student.grade.name}-${tx.student.division.name}`
        : "-";

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: T.outlineVariant,
            }}
        >
            <View
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: T.successLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Ionicons name="arrow-down-outline" size={18} color={T.success} />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: T.onSurface }}>
                    {tx.student?.name ?? "Unknown Student"}
                </Text>
                <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 1 }}>
                    Class {classLabel}
                </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: T.success }}>
                    ₹{tx.amount.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 11, color: T.outline, marginTop: 1 }}>
                    {formatTransactionTime(tx.created_at)}
                </Text>
            </View>
        </View>
    );
}

// ─── Top Pending Class Row ─────────────────────────────────────────────────────
function PendingClassRow({
    rank,
    label,
    pending,
    studentsCount,
    isLast,
}: {
    rank: number;
    label: string;
    pending: number;
    studentsCount: number;
    isLast: boolean;
}) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: T.outlineVariant,
            }}
        >
            <View
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: T.errorContainer,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Text style={{ fontSize: 12, fontWeight: "800", color: T.error }}>{rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: T.onSurface }}>
                    Class {label}
                </Text>
                <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 1 }}>
                    {studentsCount} student{studentsCount === 1 ? "" : "s"} pending
                </Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "800", color: T.error }}>
                ₹{pending.toLocaleString()}
            </Text>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const academicMonth = useMemo(() => getDefaultAcademicMonth(), []);
    const today = useMemo(() => new Date(), []);

    const [rows, setRows] = useState<ReportStudentRow[]>([]);
    const [recentPayments, setRecentPayments] = useState<RecentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);

            const [reportResult, paymentsResult] = await Promise.all([
                getReportData({ month: academicMonth.month, year: academicMonth.year }),
                getRecentTransactions(8),
            ]);

            if (reportResult.error || !reportResult.data) { setError(true); return; }

            setRows(reportResult.data);
            setRecentPayments(paymentsResult.data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [academicMonth]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [fetchDashboard]),
    );

    const summary = useMemo(() => generateReportSummary({ rows }), [rows]);

    const topPendingClasses = useMemo(() => {
        const byClass = new Map<string, { label: string; pending: number; studentsCount: number }>();

        for (const row of rows) {
            if (row.status === "Excluded") continue;
            const pending = Math.max(0, (row.fee ?? 0) - (row.paid_amount ?? 0));
            if (pending <= 0) continue;

            const label = `${row.grade?.name ?? "-"}-${row.division?.name ?? "-"}`;
            const entry = byClass.get(label) ?? { label, pending: 0, studentsCount: 0 };
            entry.pending += pending;
            entry.studentsCount += 1;
            byClass.set(label, entry);
        }

        return [...byClass.values()].sort((a, b) => b.pending - a.pending).slice(0, 5);
    }, [rows]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(clearUser());
        router.replace("/(auth)/role-select");
    };

    if (loading) {
        return <LoadingState title="Loading Dashboard" subtitle="Fetching your stats..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Dashboard Unavailable"
                subtitle="Could not load dashboard stats. Please try again."
                onRetry={fetchDashboard}
            />
        );
    }

    return (
        <ScreenWrapper backgroundColor={T.background}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}
            >
                {/* ── Header ── */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: T.onSurfaceVariant, letterSpacing: 0.02 * 12, textTransform: "uppercase" }}>
                            {getGreeting()}
                        </Text>
                        <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 22, fontWeight: "800", color: T.onSurface, letterSpacing: -0.02 * 22 }}>
                            {user?.name ?? "Admin"}
                        </Text>
                        <Text style={{ marginTop: 6, fontSize: 12, color: T.onSurfaceVariant }}>
                            {today.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                            {"  ·  "}
                            {formatAcademicMonth(academicMonth)}
                        </Text>
                    </View>

                    {/* Menu icon */}
                    <Pressable
                        onPress={() => setShowDrawer(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Open menu"
                        style={({ pressed }) => ({
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: T.surface,
                            borderWidth: 1,
                            borderColor: T.outlineVariant,
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: pressed ? 0.7 : 1,
                            shadowColor: "#000",
                            shadowOpacity: 0.04,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 2,
                        })}
                    >
                        <Ionicons name="menu-outline" size={22} color={T.onSurface} />
                    </Pressable>
                </View>

                {/* ── KPI Cards ── */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                    <CounterTile
                        label="Total Students"
                        value={summary.totalStudents}
                        icon="school-outline"
                        iconColor={T.primary}
                        iconBg={T.primaryFixed}
                    />
                    <CounterTile
                        label="Collected"
                        value={`₹${summary.totalCollection.toLocaleString()}`}
                        icon="checkmark-circle-outline"
                        iconColor={T.success}
                        iconBg={T.successLight}
                    />
                </View>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                    <CounterTile
                        label="Pending"
                        value={`₹${summary.totalPending.toLocaleString()}`}
                        icon="alert-circle-outline"
                        iconColor={T.error}
                        iconBg={T.errorContainer}
                    />
                    <CounterTile
                        label="Defaulters"
                        value={summary.defaultersCount}
                        icon="people-outline"
                        iconColor={T.warning}
                        iconBg={T.warningLight}
                    />
                </View>

                {/* ── Collection Progress ── */}
                <View style={[S.card, { marginBottom: 20 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <Text style={S.sectionTitle}>Collection Progress</Text>
                        <Text style={{ fontSize: 20, fontWeight: "800", color: T.primary }}>
                            {summary.collectionRate}%
                        </Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: T.surfaceContainer, borderRadius: 999, overflow: "hidden" }}>
                        <View
                            style={{
                                width: `${Math.min(summary.collectionRate, 100)}%`,
                                height: 8,
                                backgroundColor: T.primary,
                                borderRadius: 999,
                            }}
                        />
                    </View>
                    <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 8 }}>
                        ₹{summary.totalCollection.toLocaleString()} of ₹{(summary.totalCollection + summary.totalPending).toLocaleString()} expected this month
                    </Text>
                </View>

                {/* ── Quick Actions ── */}
                <View style={[S.card, { marginBottom: 20 }]}>
                    <Text style={S.sectionTitle}>Quick Actions</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <QuickAction
                            icon="person-add-outline"
                            label="Add Student"
                            onPress={() => router.push("/(admin)/students")}
                            accent={T.primary}
                            accentBg={T.primaryFixed}
                        />
                        <QuickAction
                            icon="layers-outline"
                            label="Manage Grades"
                            onPress={() => router.push("/(admin)/grades")}
                            accent={T.success}
                            accentBg={T.successLight}
                        />
                        <QuickAction
                            icon="people-outline"
                            label="Accounts"
                            onPress={() => router.push("/(admin)/account-management")}
                            accent={T.info}
                            accentBg={T.infoLight}
                        />
                        <QuickAction
                            icon="document-text-outline"
                            label="Reports"
                            onPress={() => router.push("/(admin)/reports")}
                            accent={T.warning}
                            accentBg={T.warningLight}
                        />
                    </View>
                </View>

                {/* ── Recent Payments ── */}
                <View style={[S.card, { marginBottom: 20 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text style={S.sectionTitle}>Recent Payments</Text>
                        <Pressable onPress={() => router.push("/(admin)/reports")} accessibilityRole="button">
                            <Text style={{ fontSize: 12, fontWeight: "700", color: T.primary }}>View All</Text>
                        </Pressable>
                    </View>

                    {recentPayments.length === 0 ? (
                        <Text style={{ fontSize: 13, color: T.onSurfaceVariant, paddingVertical: 8 }}>
                            No payments recorded yet.
                        </Text>
                    ) : (
                        recentPayments.map((tx, idx) => (
                            <PaymentRow key={tx.id} tx={tx} isLast={idx === recentPayments.length - 1} />
                        ))
                    )}
                </View>

                {/* ── Top Pending Classes ── */}
                <View style={S.card}>
                    <Text style={S.sectionTitle}>Top Pending Classes</Text>

                    {topPendingClasses.length === 0 ? (
                        <Text style={{ fontSize: 13, color: T.onSurfaceVariant, paddingVertical: 8 }}>
                            No outstanding dues this month.
                        </Text>
                    ) : (
                        topPendingClasses.map((cls, idx) => (
                            <PendingClassRow
                                key={cls.label}
                                rank={idx + 1}
                                label={cls.label}
                                pending={cls.pending}
                                studentsCount={cls.studentsCount}
                                isLast={idx === topPendingClasses.length - 1}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            {/* ── App Drawer ── */}
            <AppDrawer
                visible={showDrawer}
                onClose={() => setShowDrawer(false)}
                userName={user?.name}
                userRole="Administrator"
                items={[
                    {
                        id: "about",
                        icon: "information-circle-outline",
                        label: "About",
                        sublabel: "App info & version",
                        onPress: () => router.push("/about"),
                    },
                    {
                        id: "privacy",
                        icon: "shield-checkmark-outline",
                        label: "Privacy Policy",
                        sublabel: "busfeeapp.netlify.app",
                        onPress: () => router.push("/privacy-policy"),
                    },
                    {
                        id: "signout",
                        icon: "log-out-outline",
                        label: "Sign Out",
                        sublabel: "Return to login screen",
                        onPress: () => setShowLogoutDialog(true),
                        variant: "danger",
                    },
                ]}
            />

            {/* ── Sign Out Confirm ── */}
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
