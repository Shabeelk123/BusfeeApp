import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppDrawer from "@/components/common/AppDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors, Shadows } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { getCurrentCoordinatorAccount } from "@/services/account.service";
import { getRecentTransactions, RecentTransaction } from "@/services/payment.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { clearUser } from "@/store/authSlice";
import { AcademicMonthOption, formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { generateReportSummary, getTopPendingClasses } from "@/utils/report";

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function formatPaymentDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
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
        <View style={[{ flex: 1, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorderLight, padding: 16 }, Shadows.card]}>
            <View
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                }}
            >
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: "800", color: Colors.textPrimary }}>
                {value}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.textMuted, marginTop: 2 }}>
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
            style={({ pressed }) => ({ flex: 1, alignItems: "center", gap: 8, opacity: pressed ? 0.7 : 1 })}
        >
            <View
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: accentBg,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={22} color={accent} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.textSecondary, textAlign: "center" }}>
                {label}
            </Text>
        </Pressable>
    );
}

// ─── Recent Collection Row ─────────────────────────────────────────────────────
function CollectionRow({ tx, isLast }: { tx: RecentTransaction; isLast: boolean }) {
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
                borderBottomColor: Colors.cardBorderLight,
            }}
        >
            <View
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: Colors.successLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Ionicons name="arrow-down-outline" size={18} color={Colors.success} />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: Colors.textPrimary }}>
                    {tx.student?.name ?? "Unknown Student"}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 1 }}>
                    Class {classLabel}
                </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.success }}>
                    ₹{tx.amount.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>
                    {formatPaymentDate(tx.payment_date)}
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
                borderBottomColor: Colors.cardBorderLight,
            }}
        >
            <View
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: Colors.dangerLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.danger }}>{rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>
                    Class {label}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 1 }}>
                    {studentsCount} student{studentsCount === 1 ? "" : "s"} pending
                </Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.danger }}>
                ₹{pending.toLocaleString()}
            </Text>
        </View>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={[{ borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorderLight, padding: 16, marginBottom: 16 }, Shadows.card]}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 }}>
                {title}
            </Text>
            {children}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CoordinatorDashboard() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const today = useMemo(() => new Date(), []);

    const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() => getDefaultAcademicMonth());
    const [gradeLabel, setGradeLabel] = useState<string | null>(null);
    const [rows, setRows] = useState<ReportStudentRow[]>([]);
    const [recentCollections, setRecentCollections] = useState<RecentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);

            const { data: account, error: accountError } = await getCurrentCoordinatorAccount();
            if (accountError || !account) { setError(true); return; }

            setGradeLabel(account.grade.name);

            const [reportResult, collectionsResult] = await Promise.all([
                getReportData({ gradeId: account.grade_id, month: selectedMonth.month, year: selectedMonth.year }),
                getRecentTransactions(8, account.grade_id),
            ]);

            if (reportResult.error || !reportResult.data) { setError(true); return; }

            setRows(reportResult.data);
            setRecentCollections(collectionsResult.data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [fetchDashboard]),
    );

    const summary = useMemo(() => generateReportSummary({ rows }), [rows]);
    const topPendingClasses = useMemo(() => getTopPendingClasses(rows, 5), [rows]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(clearUser());
        router.replace("/(auth)/role-select");
    };

    if (loading) {
        return <LoadingState title="Loading Dashboard" subtitle="Fetching your grade's stats..." />;
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
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
                {/* ── Header ── */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>
                            {getGreeting()}
                        </Text>
                        <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 22, fontWeight: "800", color: Colors.textPrimary }}>
                            {user?.name ?? "Coordinator"}
                        </Text>
                        <Text style={{ marginTop: 6, fontSize: 12, color: Colors.textSecondary }}>
                            {today.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                            {gradeLabel ? `  ·  Grade ${gradeLabel}` : ""}
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => setShowDrawer(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Open menu"
                        style={({ pressed }) => [
                            {
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: Colors.card,
                                borderWidth: 1,
                                borderColor: Colors.cardBorderLight,
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: pressed ? 0.7 : 1,
                            },
                            Shadows.card,
                        ]}
                    >
                        <Ionicons name="menu-outline" size={22} color={Colors.textPrimary} />
                    </Pressable>
                </View>

                {/* ── Academic Month Selector ── */}
                <View style={{ marginBottom: 4 }}>
                    <AcademicMonthSelect value={selectedMonth} onChange={setSelectedMonth} />
                </View>

                {/* ── Summary Cards ── */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                    <CounterTile
                        label="Total Students"
                        value={summary.totalStudents}
                        icon="school-outline"
                        iconColor={Colors.primary}
                        iconBg={Colors.primaryLight}
                    />
                    <CounterTile
                        label="Collected"
                        value={`₹${summary.totalCollection.toLocaleString()}`}
                        icon="checkmark-circle-outline"
                        iconColor={Colors.success}
                        iconBg={Colors.successLight}
                    />
                </View>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                    <CounterTile
                        label="Pending"
                        value={`₹${summary.totalPending.toLocaleString()}`}
                        icon="alert-circle-outline"
                        iconColor={Colors.danger}
                        iconBg={Colors.dangerLight}
                    />
                    <CounterTile
                        label="Defaulters"
                        value={summary.defaultersCount}
                        icon="people-outline"
                        iconColor={Colors.warning}
                        iconBg={Colors.warningLight}
                    />
                </View>

                {/* ── Quick Actions (read-only navigation, no CRUD) ── */}
                <View style={[{ borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorderLight, padding: 16, marginBottom: 20 }, Shadows.card]}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary, marginBottom: 14 }}>
                        Quick Actions
                    </Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <QuickAction
                            icon="people-outline"
                            label="Students"
                            onPress={() => router.push("/(coordinator)/students")}
                            accent={Colors.primary}
                            accentBg={Colors.primaryLight}
                        />
                        <QuickAction
                            icon="document-text-outline"
                            label="Reports"
                            onPress={() => router.push("/(coordinator)/reports")}
                            accent={Colors.info}
                            accentBg={Colors.infoLight}
                        />
                        <QuickAction
                            icon="alert-circle-outline"
                            label="Defaulters"
                            onPress={() => router.push("/(coordinator)/defaulters")}
                            accent={Colors.danger}
                            accentBg={Colors.dangerLight}
                        />
                    </View>
                </View>

                {/* ── Recent Collections ── */}
                <SectionCard title={`Recent Collections — ${formatAcademicMonth(selectedMonth)}`}>
                    {recentCollections.length === 0 ? (
                        <Text style={{ fontSize: 13, color: Colors.textSecondary, paddingVertical: 8 }}>
                            No payments recorded yet.
                        </Text>
                    ) : (
                        recentCollections.map((tx, idx) => (
                            <CollectionRow key={tx.id} tx={tx} isLast={idx === recentCollections.length - 1} />
                        ))
                    )}
                </SectionCard>

                {/* ── Top Pending Classes ── */}
                <View style={[{ borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorderLight, padding: 16 }, Shadows.card]}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 }}>
                        Top Pending Classes
                    </Text>

                    {topPendingClasses.length === 0 ? (
                        <Text style={{ fontSize: 13, color: Colors.textSecondary, paddingVertical: 8 }}>
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
                userRole="Coordinator"
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
