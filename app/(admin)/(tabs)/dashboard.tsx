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

import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useAppSelector } from "@/hooks/redux";
import { getCoordinatorAccounts } from "@/services/account.service";
import { getReportData, ReportStudentRow } from "@/services/report.service";
import {
    formatAcademicMonth,
    getDefaultAcademicMonth,
} from "@/utils/academicYear";
import {
    ClassGroup,
    generateReportSummary,
    groupByClass,
} from "@/utils/report";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Design Tokens (Stitch: "Academic Transit Logistics" — Navy / Bus Yellow) ──
const T = {
  background: "#f7fafc",
  surface: "#ffffff",
  surfaceSunken: "#f1f4f6",
  primary: "#1a2b48", // deep navy — headers, primary actions
  primaryDeep: "#031632",
  primaryLight: "#e8ebf2",
  accent: "#fdb813", // bus yellow — secondary actions, highlights
  accentDeep: "#7c5800",
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

// ─── Class status: derived purely from this month's collection rate ───────────
type ClassStatus = "Lagging" | "Steady" | "Excellent";

function getClassStatus(rate: number): {
  label: ClassStatus;
  color: string;
  bg: string;
} {
  if (rate >= 85)
    return { label: "Excellent", color: T.success, bg: T.successLight };
  if (rate >= 50)
    return { label: "Steady", color: T.warning, bg: T.warningLight };
  return { label: "Lagging", color: T.danger, bg: T.dangerLight };
}

/** "8" → "8th", "1" → "1st", "23" → "23rd" — grade filter chip labels. */
function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
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
    primary: { color: T.primary, bg: T.primaryLight },
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
      style={({ pressed }) => [
        S.card,
        { flex: 1, padding: 14, opacity: pressed && onPress ? 0.85 : 1 },
      ]}
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
      <Text
        numberOfLines={1}
        style={{
          fontSize: 19,
          fontWeight: "800",
          color: T.onSurface,
          letterSpacing: -0.3,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: T.onSurfaceVariant,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Quick Action ───────────────────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  onPress,
  variant = "ghost",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: "primary" | "accent" | "ghost";
}) {
  const styleMap = {
    primary: { bg: T.primary, fg: "#ffffff", border: T.primary },
    accent: { bg: T.accent, fg: T.primaryDeep, border: T.accent },
    ghost: { bg: T.surface, fg: T.primary, border: T.outline },
  };
  const v = styleMap[variant];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: "47%",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: v.bg,
        borderWidth: 1,
        borderColor: v.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={16} color={v.fg} />
      <Text
        numberOfLines={1}
        style={{ fontSize: 13, fontWeight: "700", color: v.fg, flexShrink: 1 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Grade Filter Chip ──────────────────────────────────────────────────────
function GradeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? T.primary : T.surface,
        borderWidth: 1,
        borderColor: active ? T.primary : T.outline,
        opacity: pressed ? 0.85 : 1,
        marginRight: 8,
      })}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: active ? "#ffffff" : T.onSurfaceVariant,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Class Overview Card — expandable, like the Students screen's class table ──
function ClassOverviewCard({
  group,
  coordinatorName,
  expanded,
  onToggle,
  onPay,
}: {
  group: ClassGroup;
  coordinatorName?: string;
  expanded: boolean;
  onToggle: () => void;
  onPay: (studentId: string) => void;
}) {
  const total = group.students.length;
  const rate = total > 0 ? Math.round((group.paidCount / total) * 100) : 0;
  const status = getClassStatus(rate);

  return (
    <View
      style={[S.card, { padding: 0, marginBottom: 12, overflow: "hidden" }]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} Class ${group.gradeName}-${group.divisionName}`}
        style={({ pressed }) => ({ padding: 18, opacity: pressed ? 0.9 : 1 })}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "800", color: T.onSurface }}
            >
              Class {group.gradeName}-{group.divisionName}
            </Text>
            {coordinatorName && (
              <Text
                style={{
                  fontSize: 11,
                  color: T.onSurfaceVariant,
                  marginTop: 2,
                }}
              >
                Coordinator: {coordinatorName}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                borderRadius: 999,
                backgroundColor: status.bg,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: status.color,
                  letterSpacing: 0.3,
                }}
              >
                {status.label.toUpperCase()}
              </Text>
            </View>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={T.onSurfaceVariant}
            />
          </View>
        </View>

        <View
          style={{
            height: 5,
            backgroundColor: T.surfaceSunken,
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          <View
            style={{
              width: `${rate}%`,
              height: 5,
              backgroundColor: status.color,
              borderRadius: 999,
            }}
          />
        </View>

        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: T.onSurfaceVariant,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Students
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: T.onSurface,
                marginTop: 3,
              }}
            >
              {group.paidCount} / {total}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: T.onSurfaceVariant,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Collection
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: T.onSurface,
                marginTop: 3,
              }}
            >
              {rate}%
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: T.onSurfaceVariant,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Pending
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: group.totalPending > 0 ? T.danger : T.success,
                marginTop: 3,
              }}
            >
              ₹{group.totalPending.toLocaleString()}
            </Text>
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: T.outline,
            padding: 12,
            backgroundColor: T.surfaceSunken,
          }}
        >
          {group.students.map((student) => {
            const pending =
              student.status === "Excluded"
                ? 0
                : Math.max(0, (student.fee ?? 0) - (student.paid_amount ?? 0));
            const tone =
              student.status === "Paid"
                ? T.success
                : student.status === "Partial"
                  ? T.warning
                  : student.status === "Excluded"
                    ? T.onSurfaceVariant
                    : T.danger;

            return (
              <View
                key={student.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: T.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: T.outline,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(admin)/students/[id]",
                      params: { id: student.id },
                    })
                  }
                  style={{ flex: 1, marginRight: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${student.name}`}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: T.onSurface,
                    }}
                  >
                    {student.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: T.onSurfaceVariant,
                      marginTop: 1,
                    }}
                  >
                    #{student.admission_no}
                  </Text>
                </Pressable>

                <View
                  style={{
                    alignItems: "flex-end",
                    marginRight: pending > 0 ? 10 : 0,
                  }}
                >
                  <Text
                    style={{ fontSize: 12, fontWeight: "800", color: tone }}
                  >
                    {student.status === "Excluded"
                      ? "Excluded"
                      : pending > 0
                        ? `₹${pending}`
                        : "Paid"}
                  </Text>
                  {pending > 0 && student.status !== "Excluded" && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: T.onSurfaceVariant,
                        marginTop: 1,
                      }}
                    >
                      pending
                    </Text>
                  )}
                </View>

                {pending > 0 && student.status !== "Excluded" && (
                  <Pressable
                    onPress={() => onPay(student.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Collect payment from ${student.name}`}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: T.primary,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Ionicons name="cash-outline" size={14} color="#ffffff" />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#ffffff",
                      }}
                    >
                      Pay
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const ALL_GRADES = "ALL";

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const user = useAppSelector((state) => state.auth.user);

  const academicMonth = useMemo(() => getDefaultAcademicMonth(), []);
  const today = useMemo(() => new Date(), []);

  const [rows, setRows] = useState<ReportStudentRow[]>([]);
  const [coordinatorByGrade, setCoordinatorByGrade] = useState<
    Map<string, string>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string>(ALL_GRADES);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const [reportResult, coordinatorsResult] = await Promise.all([
        getReportData({ month: academicMonth.month, year: academicMonth.year }),
        getCoordinatorAccounts(),
      ]);

      if (reportResult.error || !reportResult.data) {
        setError(true);
        return;
      }

      setRows(reportResult.data);
      setCoordinatorByGrade(
        new Map(
          (coordinatorsResult.data ?? []).map((c) => [
            c.grade.name,
            c.user.name,
          ]),
        ),
      );
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

  const classGroups = useMemo(() => groupByClass(rows), [rows]);

  const gradeOptions = useMemo(() => {
    return [...new Set(classGroups.map((g) => g.gradeName))].sort(
      (a, b) => (Number(a) || 0) - (Number(b) || 0),
    );
  }, [classGroups]);

  const filteredClasses = useMemo(() => {
    const scoped =
      gradeFilter === ALL_GRADES
        ? classGroups
        : classGroups.filter((g) => g.gradeName === gradeFilter);
    // Worst collection rate first — the classes needing attention surface immediately.
    return [...scoped].sort((a, b) => {
      const rateA = a.students.length > 0 ? a.paidCount / a.students.length : 1;
      const rateB = b.students.length > 0 ? b.paidCount / b.students.length : 1;
      return rateA - rateB;
    });
  }, [classGroups, gradeFilter]);

  const toggleClass = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const handlePay = (studentId: string) => {
    router.push({
      pathname: "/(admin)/students/add-payment",
      params: {
        studentId,
        month: academicMonth.month,
        year: academicMonth.year,
      },
    });
  };

  if (loading) {
    return (
      <LoadingState
        title="Loading Dashboard"
        subtitle="Fetching your stats..."
      />
    );
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
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: T.onSurfaceVariant,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            Dashboard
          </Text>
          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              fontSize: 22,
              fontWeight: "800",
              color: T.onSurface,
              letterSpacing: -0.4,
            }}
          >
            {user?.name ?? "Admin"}
          </Text>
          <Text
            style={{ marginTop: 6, fontSize: 12, color: T.onSurfaceVariant }}
          >
            {today.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            {"  ·  "}
            {formatAcademicMonth(academicMonth)}
          </Text>
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
            onPress={() => router.push("/(admin)/reports/defaulters")}
          />
        </View>

        {/* ── Quick Actions ── */}
        <Text style={[S.sectionTitle, { marginBottom: 10 }]}>
          Quick Actions
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <QuickAction
            icon="person-add-outline"
            label="Add Student"
            variant="primary"
            onPress={() => router.push("/(admin)/students/create")}
          />
          <QuickAction
            icon="school-outline"
            label="Add Class"
            variant="accent"
            onPress={() => router.push("/(admin)/grades/create")}
          />
          <QuickAction
            icon="person-circle-outline"
            label="Add Coordinator"
            onPress={() => router.push("/(admin)/coordinator-accounts/create")}
          />
        </View>

        {/* ── Class Overview ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={S.sectionTitle}>Class Overview</Text>
            <Text
              style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 2 }}
            >
              Review student capacity and payment collection status
            </Text>
          </View>
        </View>

        {gradeOptions.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 14 }}
          >
            <GradeChip
              label="All"
              active={gradeFilter === ALL_GRADES}
              onPress={() => setGradeFilter(ALL_GRADES)}
            />
            {gradeOptions.map((name) => (
              <GradeChip
                key={name}
                label={ordinal(Number(name) || 0)}
                active={gradeFilter === name}
                onPress={() => setGradeFilter(name)}
              />
            ))}
          </ScrollView>
        )}

        {filteredClasses.length === 0 ? (
          <View
            style={[
              S.card,
              {
                alignItems: "center",
                paddingVertical: 28,
                marginTop: gradeOptions.length > 1 ? 0 : 14,
              },
            ]}
          >
            <Ionicons
              name="school-outline"
              size={26}
              color={T.onSurfaceVariant}
            />
            <Text
              style={{ marginTop: 8, fontSize: 13, color: T.onSurfaceVariant }}
            >
              No classes to show for this selection.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: gradeOptions.length > 1 ? 0 : 14 }}>
            {filteredClasses.slice(0, 6).map((group) => (
              <ClassOverviewCard
                key={group.key}
                group={group}
                coordinatorName={coordinatorByGrade.get(group.gradeName)}
                expanded={expandedKey === group.key}
                onToggle={() => toggleClass(group.key)}
                onPay={handlePay}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
