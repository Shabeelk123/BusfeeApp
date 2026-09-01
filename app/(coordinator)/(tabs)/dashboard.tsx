import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    LayoutAnimation,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    UIManager,
    View,
} from "react-native";

import AcademicMonthSelect from "@/components/common/AcademicMonthSelect";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useAppSelector } from "@/hooks/redux";
import { getCurrentCoordinatorAccount } from "@/services/account.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import { AcademicMonthOption, formatAcademicMonth, getDefaultAcademicMonth } from "@/utils/academicYear";
import { ClassGroup, generateReportSummary, groupByClass } from "@/utils/report";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Design Tokens (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background: "#f7fafc",
    surface: "#ffffff",
    surfaceSunken: "#f1f4f6",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
    success: "#2d7a4d",
    successLight: "#e3f3e9",
    warning: "#b7791f",
    warningLight: "#fdf3e0",
    danger: "#e53e3e",
    dangerLight: "#fdeaea",
} as const;

const S = StyleSheet.create({
    card: {
        backgroundColor: T.surface,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: T.outline,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: T.onSurface,
        letterSpacing: -0.2,
    },
});

// Division status derived purely from this month's collection rate — same
// thresholds as the Admin Dashboard's Class Overview so "Lagging" means the
// same thing everywhere in the app.
type ClassStatus = "Lagging" | "Steady" | "Excellent";

function getClassStatus(rate: number): { label: ClassStatus; color: string; bg: string } {
    if (rate >= 85) return { label: "Excellent", color: T.success, bg: T.successLight };
    if (rate >= 50) return { label: "Steady", color: T.warning, bg: T.warningLight };
    return { label: "Lagging", color: T.danger, bg: T.dangerLight };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    icon,
    tone,
    onPress,
}: {
    label: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    tone: "primary" | "success" | "danger" | "warning";
    onPress?: () => void;
}) {
    const toneMap = {
        primary: { color: T.navy, bg: T.navyLight },
        success: { color: T.success, bg: T.successLight },
        danger: { color: T.danger, bg: T.dangerLight },
        warning: { color: T.warning, bg: T.warningLight },
    };
    const c = toneMap[tone];

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityLabel={onPress ? label : undefined}
            style={({ pressed }) => [S.card, { flex: 1, padding: 14, opacity: pressed && onPress ? 0.85 : 1 }]}
        >
            <View
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: c.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                }}
            >
                <Ionicons name={icon} size={17} color={c.color} />
            </View>
            <Text numberOfLines={1} style={{ fontSize: 19, fontWeight: "800", color: T.onSurface, letterSpacing: -0.3 }}>
                {value}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: T.onSurfaceVariant, marginTop: 2 }}>
                {label}
            </Text>
        </Pressable>
    );
}

// ─── Division Overview Card — expandable, read-only (Coordinator can't collect) ─
function DivisionOverviewCard({
    group,
    expanded,
    onToggle,
}: {
    group: ClassGroup;
    expanded: boolean;
    onToggle: () => void;
}) {
    const total = group.students.length;
    const rate = total > 0 ? Math.round((group.paidCount / total) * 100) : 0;
    const status = getClassStatus(rate);

    return (
        <View style={[S.card, { padding: 0, marginBottom: 12, overflow: "hidden" }]}>
            <Pressable
                onPress={onToggle}
                accessibilityRole="button"
                accessibilityLabel={`${expanded ? "Collapse" : "Expand"} Division ${group.divisionName}`}
                style={({ pressed }) => ({ padding: 18, opacity: pressed ? 0.9 : 1 })}
            >
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: T.onSurface }}>
                        Division {group.divisionName}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ borderRadius: 999, backgroundColor: status.bg, paddingHorizontal: 10, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: "800", color: status.color, letterSpacing: 0.3 }}>
                                {status.label.toUpperCase()}
                            </Text>
                        </View>
                        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={T.onSurfaceVariant} />
                    </View>
                </View>

                <View style={{ height: 5, backgroundColor: T.surfaceSunken, borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
                    <View style={{ width: `${rate}%`, height: 5, backgroundColor: status.color, borderRadius: 999 }} />
                </View>

                <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.4 }}>
                            Students
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: T.onSurface, marginTop: 3 }}>
                            {group.paidCount} / {total}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.4 }}>
                            Collection
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: T.onSurface, marginTop: 3 }}>
                            {rate}%
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.4 }}>
                            Pending
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: group.totalPending > 0 ? T.danger : T.success, marginTop: 3 }}>
                            ₹{group.totalPending.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </Pressable>

            {expanded && (
                <View style={{ borderTopWidth: 1, borderTopColor: T.outline, padding: 12, backgroundColor: T.surfaceSunken }}>
                    {group.students.map((student) => {
                        const pending = student.status === "Excluded" ? 0 : Math.max(0, (student.fee ?? 0) - (student.paid_amount ?? 0));
                        const tone =
                            student.status === "Paid" ? T.success
                                : student.status === "Partial" ? T.warning
                                : student.status === "Excluded" ? T.onSurfaceVariant
                                : T.danger;

                        return (
                            <Pressable
                                key={student.id}
                                onPress={() => router.push({ pathname: "/(coordinator)/students/[id]", params: { id: student.id } })}
                                accessibilityRole="button"
                                accessibilityLabel={`View ${student.name}`}
                                style={({ pressed }) => ({
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: T.surface,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: T.outline,
                                    padding: 12,
                                    marginBottom: 8,
                                    opacity: pressed ? 0.8 : 1,
                                })}
                            >
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: T.onSurface }}>
                                        {student.name}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 1 }}>
                                        #{student.admission_no}
                                    </Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={{ fontSize: 12, fontWeight: "800", color: tone }}>
                                        {student.status === "Excluded" ? "Excluded" : pending > 0 ? `₹${pending}` : "Paid"}
                                    </Text>
                                    {pending > 0 && student.status !== "Excluded" && (
                                        <Text style={{ fontSize: 10, color: T.onSurfaceVariant, marginTop: 1 }}>pending</Text>
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CoordinatorDashboard() {
    const user = useAppSelector((state) => state.auth.user);

    const today = useMemo(() => new Date(), []);

    const [selectedMonth, setSelectedMonth] = useState<AcademicMonthOption>(() => getDefaultAcademicMonth());
    const [gradeLabel, setGradeLabel] = useState<string | null>(null);
    const [rows, setRows] = useState<ReportStudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);

            const { data: account, error: accountError } = await getCurrentCoordinatorAccount();
            if (accountError || !account) { setError(true); return; }

            setGradeLabel(account.grade.name);

            const { data, error: reportError } = await getReportData({
                gradeId: account.grade_id,
                month: selectedMonth.month,
                year: selectedMonth.year,
            });

            if (reportError || !data) { setError(true); return; }
            setRows(data);
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

    const divisionGroups = useMemo(() => {
        const groups = groupByClass(rows);
        // Worst collection rate first — the divisions needing attention surface immediately.
        return [...groups].sort((a, b) => {
            const rateA = a.students.length > 0 ? a.paidCount / a.students.length : 1;
            const rateB = b.students.length > 0 ? b.paidCount / b.students.length : 1;
            return rateA - rateB;
        });
    }, [rows]);

    const toggleDivision = (key: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedKey((prev) => (prev === key ? null : key));
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
        <ScreenWrapper backgroundColor={T.background}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
                {/* ── Header ── */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: T.onSurfaceVariant, letterSpacing: 0.3, textTransform: "uppercase" }}>
                        Dashboard
                    </Text>
                    <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 22, fontWeight: "800", color: T.onSurface, letterSpacing: -0.4 }}>
                        {user?.name ?? "Coordinator"}
                    </Text>
                    <Text style={{ marginTop: 6, fontSize: 12, color: T.onSurfaceVariant }}>
                        {today.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                        {gradeLabel ? `  ·  Grade ${gradeLabel}` : ""}
                    </Text>
                </View>

                {/* ── Academic Month Selector ── */}
                <View style={{ marginBottom: 16 }}>
                    <AcademicMonthSelect value={selectedMonth} onChange={setSelectedMonth} />
                </View>

                {/* ── Stat Cards ── */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <StatCard
                        label="Total Students"
                        value={summary.totalStudents}
                        icon="people-outline"
                        tone="primary"
                    />
                    <StatCard
                        label="Avg. Collection"
                        value={`${summary.collectionRate}%`}
                        icon="trending-up-outline"
                        tone="success"
                    />
                </View>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
                    <StatCard
                        label="Pending Payments"
                        value={`₹${summary.totalPending.toLocaleString()}`}
                        icon="alert-circle-outline"
                        tone="danger"
                    />
                    <StatCard
                        label="Defaulters"
                        value={summary.defaultersCount}
                        icon="warning-outline"
                        tone="warning"
                        onPress={() => router.push("/(coordinator)/defaulters")}
                    />
                </View>

                {/* ── Division Overview ── */}
                <View style={{ marginBottom: 14 }}>
                    <Text style={S.sectionTitle}>Division Overview</Text>
                    <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 2 }}>
                        {formatAcademicMonth(selectedMonth)} collection status by division
                    </Text>
                </View>

                {divisionGroups.length === 0 ? (
                    <View style={[S.card, { alignItems: "center", paddingVertical: 28 }]}>
                        <Ionicons name="school-outline" size={26} color={T.onSurfaceVariant} />
                        <Text style={{ marginTop: 8, fontSize: 13, color: T.onSurfaceVariant }}>
                            No students to show for this grade yet.
                        </Text>
                    </View>
                ) : (
                    divisionGroups.map((group) => (
                        <DivisionOverviewCard
                            key={group.key}
                            group={group}
                            expanded={expandedKey === group.key}
                            onToggle={() => toggleDivision(group.key)}
                        />
                    ))
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
