import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import AppDrawer from "@/components/common/AppDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import StudentFeeRow from "@/components/students/StudentFeeRow";
import { Colors, Shadows } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { getCurrentClassAccount } from "@/services/account.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { clearUser } from "@/store/authSlice";
import { formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { generateReportSummary } from "@/utils/report";

type StatusFilter = "all" | "pending" | "paid";

// ── Stat Tile ─────────────────────────────────────────────────────────────────
function StatTile({
    label,
    value,
    iconColor,
    iconBg,
    icon,
}: {
    label: string;
    value: string;
    iconColor: string;
    iconBg: string;
    icon: keyof typeof Ionicons.glyphMap;
}) {
    return (
        <View style={[{ flex: 1, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorderLight, padding: 14 }, Shadows.card]}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Ionicons name={icon} size={16} color={iconColor} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.textPrimary }} numberOfLines={1}>
                {value}
            </Text>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{label}</Text>
        </View>
    );
}

// ── Status Filter Tabs ────────────────────────────────────────────────────────
function StatusTabs({
    value,
    onChange,
    allCount,
    pendingCount,
    paidCount,
}: {
    value: StatusFilter;
    onChange: (v: StatusFilter) => void;
    allCount: number;
    pendingCount: number;
    paidCount: number;
}) {
    const tabs: { key: StatusFilter; label: string; count: number }[] = [
        { key: "all", label: "All", count: allCount },
        { key: "pending", label: "Pending", count: pendingCount },
        { key: "paid", label: "Paid", count: paidCount },
    ];

    return (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {tabs.map((tab) => {
                const isActive = value === tab.key;
                return (
                    <Pressable
                        key={tab.key}
                        onPress={() => onChange(tab.key)}
                        style={({ pressed }) => ({
                            flex: 1,
                            alignItems: "center",
                            borderRadius: 12,
                            paddingVertical: 10,
                            backgroundColor: isActive ? Colors.primary : Colors.card,
                            borderWidth: 1,
                            borderColor: isActive ? Colors.primary : Colors.cardBorderLight,
                            opacity: pressed ? 0.8 : 1,
                        })}
                        accessibilityRole="button"
                        accessibilityLabel={`${tab.label} (${tab.count})`}
                    >
                        <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? Colors.textOnDark : Colors.textPrimary }}>
                            {tab.label} ({tab.count})
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ClassDashboard() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const [selectedMonth, setSelectedMonth] = useState(() => getDefaultAcademicMonth());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const [classLabel, setClassLabel] = useState<string | null>(null);
    const [rows, setRows] = useState<ReportStudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);

            const { data: account, error: accountError } = await getCurrentClassAccount();
            if (accountError || !account) { setError(true); return; }

            setClassLabel(`${account.grade.name}-${account.division.name}`);

            const { data, error } = await getReportData({
                gradeId: account.grade_id,
                divisionId: account.division_id,
                month: selectedMonth.month,
                year: selectedMonth.year,
            });

            if (error || !data) { setError(true); return; }
            setRows(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData]),
    );

    const summary = useMemo(() => generateReportSummary({ rows }), [rows]);

    const pendingRows = useMemo(
        () => rows.filter((r) => r.status === "Pending" || r.status === "Partial"),
        [rows],
    );
    const paidRows = useMemo(() => rows.filter((r) => r.status === "Paid"), [rows]);

    const filteredRows = useMemo(() => {
        if (statusFilter === "pending") return pendingRows;
        if (statusFilter === "paid") return paidRows;
        return rows;
    }, [statusFilter, rows, pendingRows, paidRows]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(clearUser());
        router.replace("/(auth)/role-select");
    };

    if (loading) {
        return <LoadingState title="Loading Class" subtitle="Fetching your class fee status..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch your class data. Please try again."
                onRetry={fetchData}
            />
        );
    }

    return (
        <ScreenWrapper>
            <FlatList
                data={filteredRows}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
                // Row cards below carry their own elevation (card shadow), which on
                // Android wins stacking over plain zIndex — the header (and its open
                // dropdown) needs a higher elevation too or list rows draw over it.
                ListHeaderComponentStyle={{ zIndex: 10, elevation: 10 }}
                renderItem={({ item }) => (
                    <StudentFeeRow
                        row={item}
                        onPress={() =>
                            router.push({
                                pathname: "/(class)/students/[id]",
                                params: { id: item.id },
                            })
                        }
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        title="No Students Yet"
                        subtitle="No students assigned to your class yet."
                        icon="school-outline"
                        iconColor={Colors.primary}
                        iconBgColor={Colors.primaryLight}
                    />
                }
                ListHeaderComponent={
                    <>
                        {/* ── Header ── */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                            <Pressable
                                onPress={() => setShowDrawer(true)}
                                style={({ pressed }) => ({
                                    width: 42,
                                    height: 42,
                                    borderRadius: 13,
                                    backgroundColor: Colors.card,
                                    borderWidth: 1,
                                    borderColor: Colors.cardBorderLight,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: pressed ? 0.7 : 1,
                                    marginRight: 12,
                                    ...Shadows.card,
                                })}
                                accessibilityRole="button"
                                accessibilityLabel="Open menu"
                            >
                                <Ionicons name="menu-outline" size={22} color={Colors.textPrimary} />
                            </Pressable>

                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>
                                    Class Portal
                                </Text>
                                <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 20, fontWeight: "800", color: Colors.textPrimary }}>
                                    {classLabel ? `Class ${classLabel}` : (user?.name ?? "Class Account")}
                                </Text>
                            </View>

                            <Pressable
                                onPress={() => router.push("/(class)/defaulters")}
                                style={({ pressed }) => ({
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    borderRadius: 12,
                                    backgroundColor: Colors.dangerLight,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    opacity: pressed ? 0.75 : 1,
                                })}
                                accessibilityRole="button"
                                accessibilityLabel="View defaulters"
                            >
                                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                                <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.danger }}>Defaulters</Text>
                            </Pressable>
                        </View>

                        {/* ── Summary Cards ── */}
                        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                            <StatTile
                                label="Students"
                                value={String(summary.totalStudents)}
                                icon="people-outline"
                                iconColor={Colors.primary}
                                iconBg={Colors.primaryLight}
                            />
                            <StatTile
                                label="Collected"
                                value={`₹${summary.totalCollection}`}
                                icon="checkmark-circle-outline"
                                iconColor={Colors.success}
                                iconBg={Colors.successLight}
                            />
                            <StatTile
                                label="Pending"
                                value={`₹${summary.totalPending}`}
                                icon="alert-circle-outline"
                                iconColor={Colors.danger}
                                iconBg={Colors.dangerLight}
                            />
                        </View>

                        {/* ── Academic Month Filter ── */}
                        <View style={{ marginBottom: 4 }}>
                            <AcademicMonthSelect
                                label="Month"
                                value={selectedMonth}
                                onChange={setSelectedMonth}
                            />
                        </View>

                        {/* ── Status Filter Tabs ── */}
                        <StatusTabs
                            value={statusFilter}
                            onChange={setStatusFilter}
                            allCount={rows.length}
                            pendingCount={pendingRows.length}
                            paidCount={paidRows.length}
                        />

                        <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.textPrimary, marginBottom: 10 }}>
                            Students — {formatAcademicMonth(selectedMonth)}
                        </Text>
                    </>
                }
            />

            {/* ── App Drawer ── */}
            <AppDrawer
                visible={showDrawer}
                onClose={() => setShowDrawer(false)}
                userName={user?.name}
                userRole="Class Account"
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
