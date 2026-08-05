import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import { Colors, Shadows } from "../../constants/colors";
import { LedgerMonth, getStudentFeeLedger, summarizeLedger } from "../../services/payment.service";
import { deleteStudent, getStudentById } from "../../services/student.service";
import AppButton from "../common/AppButton";
import ConfirmDialog from "../common/ConfirmDialog";
import PageHeader from "../common/PageHeader";
import ScreenWrapper from "../common/ScreenWrapper";
import { useToast } from "../common/ToastContext";

interface Props {
    role: "ADMIN" | "CLASS" | "COORDINATOR";
    baseRoute: "/(admin)" | "/(teacher)" | "/(class)" | "/(coordinator)";
}

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const STATUS_TONE: Record<string, { color: string; bg: string; border: string }> = {
    Paid:     { color: Colors.success, bg: Colors.successLight, border: Colors.successBorder },
    Partial:  { color: Colors.warning, bg: Colors.warningLight, border: Colors.warningBorder },
    Pending:  { color: Colors.danger,  bg: Colors.dangerLight,  border: Colors.dangerBorder },
    Excluded: { color: Colors.textMuted, bg: Colors.cardBorderLight, border: Colors.cardBorder },
};

// ─── Small building blocks ─────────────────────────────────────────────────────

function SummaryCard({
    label,
    value,
    tone = "primary",
}: {
    label: string;
    value: string;
    tone?: "primary" | "success" | "danger";
}) {
    const toneColor =
        tone === "success" ? Colors.success : tone === "danger" ? Colors.danger : Colors.primary;
    const toneBg =
        tone === "success" ? Colors.successLight : tone === "danger" ? Colors.dangerLight : Colors.primaryLight;

    return (
        <View
            style={[
                {
                    flex: 1,
                    borderRadius: 16,
                    backgroundColor: Colors.card,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    padding: 14,
                    minHeight: 82,
                },
                Shadows.card,
            ]}
        >
            <View
                style={{
                    alignSelf: "flex-start",
                    borderRadius: 999,
                    backgroundColor: toneBg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginBottom: 8,
                }}
            >
                <Text style={{ color: toneColor, fontSize: 10, fontWeight: "700" }}>{label}</Text>
            </View>
            <Text numberOfLines={1} style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "800" }}>
                {value}
            </Text>
        </View>
    );
}

function InfoRow({
    icon,
    label,
    value,
    isLast,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string | number | null;
    isLast?: boolean;
}) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 13,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: Colors.cardBorderLight,
            }}
        >
            <View
                style={{
                    height: 36,
                    width: 36,
                    borderRadius: 12,
                    backgroundColor: Colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Ionicons name={icon} size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: "600" }}>{label}</Text>
                <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: "600", marginTop: 2 }}>
                    {value ?? "-"}
                </Text>
            </View>
        </View>
    );
}

function StatusPill({ status }: { status: string }) {
    const tone = STATUS_TONE[status] ?? STATUS_TONE.Pending;
    return (
        <View style={{ borderRadius: 999, backgroundColor: tone.bg, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: tone.color }}>{status}</Text>
        </View>
    );
}

function LedgerRow({
    entry,
    baseRoute,
    studentId,
    canCollectPayment,
}: {
    entry: LedgerMonth;
    baseRoute: Props["baseRoute"];
    studentId: string;
    canCollectPayment: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const pending = Math.max(0, entry.fee - entry.paid_amount);
    const tone = STATUS_TONE[entry.status] ?? STATUS_TONE.Pending;

    return (
        <View
            style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: tone.border,
                backgroundColor: Colors.card,
                marginBottom: 10,
                overflow: "hidden",
            }}
        >
            <Pressable
                onPress={() => setExpanded((v) => !v)}
                style={({ pressed }) => ({ padding: 14, opacity: pressed ? 0.8 : 1 })}
                accessibilityRole="button"
                accessibilityLabel={`${MONTH_NAMES[entry.month - 1]} ${entry.year} details`}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: "800" }}>
                            {MONTH_NAMES[entry.month - 1]} {entry.year}
                        </Text>
                        <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 3 }}>
                            Fee ₹{entry.fee} · Paid ₹{entry.paid_amount} · Pending ₹{pending}
                        </Text>
                    </View>
                    <StatusPill status={entry.status} />
                    <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={Colors.textMuted}
                        style={{ marginLeft: 8 }}
                    />
                </View>
            </Pressable>

            {expanded && (
                <View style={{ borderTopWidth: 1, borderTopColor: Colors.cardBorderLight, padding: 14, backgroundColor: Colors.inputBg }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                        Transactions this month
                    </Text>

                    {entry.transactions.length === 0 ? (
                        <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 12 }}>
                            No payments recorded yet.
                        </Text>
                    ) : (
                        entry.transactions.map((t) => (
                            <View
                                key={t.id}
                                style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}
                            >
                                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                                    {t.payment_date}{t.remarks ? ` · ${t.remarks}` : ""}
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.success }}>
                                    ₹{t.amount}
                                </Text>
                            </View>
                        ))
                    )}

                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: 8,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: Colors.cardBorder,
                            marginBottom: 14,
                        }}
                    >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textMuted }}>
                            Remaining Balance
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: pending > 0 ? Colors.danger : Colors.success }}>
                            ₹{pending}
                        </Text>
                    </View>

                    {canCollectPayment && entry.status !== "Excluded" && (
                        <AppButton
                            label="Collect Payment"
                            iconLeft="add-circle-outline"
                            fullWidth
                            size="sm"
                            onPress={() =>
                                router.push({
                                    pathname: `${baseRoute}/students/add-payment` as any,
                                    params: { studentId, month: entry.month, year: entry.year },
                                })
                            }
                        />
                    )}
                </View>
            )}
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────

export default function StudentDetailsScreen({ role, baseRoute }: Props) {
    const toast = useToast();
    const { id } = useLocalSearchParams();
    const [student, setStudent] = useState<any>(null);
    const [ledger, setLedger] = useState<LedgerMonth[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // COORDINATOR is fully read-only — ADMIN and CLASS can both collect payments.
    const canCollectPayment = role !== "COORDINATOR";

    const fetchStudent = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await getStudentById(id as string);
            if (!data) { setStudent(null); return; }
            setStudent(data);

            const { data: ledgerData } = await getStudentFeeLedger(
                data.id,
                data.monthly_fee,
                data.created_at,
            );
            setLedger(ledgerData);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(useCallback(() => { fetchStudent(); }, [fetchStudent]));

    const handleDelete = async () => {
        const { error } = await deleteStudent(student.id);
        if (error) {
            toast.error("Delete Failed", error.message);
            return;
        }
        router.back();
    };

    // ── Derived: outstanding, paid, recent transactions ──
    const { totalPaid, outstanding, recentTransactions } = useMemo(
        () => summarizeLedger(ledger),
        [ledger],
    );

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 14 }}>
                        Loading profile...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!student) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="alert-circle-outline" size={44} color={Colors.textMuted} />
                    <Text style={{ marginTop: 14, fontSize: 18, fontWeight: "700", color: Colors.textPrimary }}>
                        Student not found
                    </Text>
                    <View style={{ marginTop: 16 }}>
                        <AppButton label="Go Back" variant="secondary" onPress={() => router.back()} />
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    const dueTone = outstanding > 0 ? "danger" : "success";

    return (
        <ScreenWrapper>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
            >
                <PageHeader
                    title={student.name}
                    subtitle={`Admission #${student.admission_no}`}
                    showBack
                />

                {/* ── Student Information ── */}
                <View
                    style={[
                        {
                            borderRadius: 18,
                            backgroundColor: Colors.card,
                            borderWidth: 1,
                            borderColor: Colors.cardBorderLight,
                            padding: 18,
                            marginBottom: 16,
                        },
                        Shadows.card,
                    ]}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                height: 58,
                                width: 58,
                                borderRadius: 18,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: Colors.primaryLight,
                                marginRight: 14,
                            }}
                        >
                            <Ionicons name="school-outline" size={28} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: "700" }}>
                                Student Information
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 2 }}
                            >
                                {student.name}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                        <View style={{ flex: 1, borderRadius: 12, backgroundColor: Colors.inputBg, paddingHorizontal: 12, paddingVertical: 10 }}>
                            <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Grade</Text>
                            <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                                {student.grade?.name ?? "-"}
                            </Text>
                        </View>
                        <View style={{ flex: 1, borderRadius: 12, backgroundColor: Colors.inputBg, paddingHorizontal: 12, paddingVertical: 10 }}>
                            <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Division</Text>
                            <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                                {student.division?.name ?? "-"}
                            </Text>
                        </View>
                        <View style={{ flex: 1, borderRadius: 12, backgroundColor: Colors.inputBg, paddingHorizontal: 12, paddingVertical: 10 }}>
                            <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Monthly Fee</Text>
                            <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                                ₹{student.monthly_fee}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Outstanding / Paid / Monthly summary ── */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                    <SummaryCard label="Monthly" value={`₹${student.monthly_fee}`} />
                    <SummaryCard label="Paid" value={`₹${totalPaid}`} tone="success" />
                    <SummaryCard label="Outstanding" value={`₹${outstanding}`} tone={dueTone} />
                </View>

                {role === "ADMIN" && (
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
                        <View style={{ flex: 1 }}>
                            <AppButton
                                label="Edit"
                                variant="secondary"
                                iconLeft="create-outline"
                                fullWidth
                                onPress={() =>
                                    router.push({
                                        pathname: "/(admin)/students/edit",
                                        params: { id: student.id },
                                    })
                                }
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppButton
                                label="Delete"
                                variant="danger"
                                iconLeft="trash-outline"
                                fullWidth
                                onPress={() => setShowDeleteDialog(true)}
                            />
                        </View>
                    </View>
                )}

                {/* ── Monthly Fee Ledger ── */}
                <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.textPrimary, marginBottom: 10 }}>
                    Monthly Fee Ledger
                </Text>
                {ledger.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 32, marginBottom: 16 }}>
                        <Ionicons name="calendar-outline" size={36} color={Colors.textMuted} />
                        <Text style={{ color: Colors.textSecondary, marginTop: 10, fontSize: 13 }}>
                            No fee months yet
                        </Text>
                    </View>
                ) : (
                    <View style={{ marginBottom: 8 }}>
                        {ledger.map((entry) => (
                            <LedgerRow
                                key={`${entry.month}-${entry.year}`}
                                entry={entry}
                                baseRoute={baseRoute}
                                studentId={student.id}
                                canCollectPayment={canCollectPayment}
                            />
                        ))}
                    </View>
                )}

                {/* ── Recent Transactions ── */}
                <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.textPrimary, marginTop: 8, marginBottom: 10 }}>
                    Recent Transactions
                </Text>
                {recentTransactions.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 32 }}>
                        <Ionicons name="card-outline" size={36} color={Colors.textMuted} />
                        <Text style={{ color: Colors.textSecondary, marginTop: 10, fontSize: 13 }}>
                            No transactions yet
                        </Text>
                    </View>
                ) : (
                    recentTransactions.map((t) => (
                        <View
                            key={t.id}
                            style={[
                                {
                                    marginBottom: 10,
                                    borderRadius: 14,
                                    backgroundColor: Colors.card,
                                    borderWidth: 1,
                                    borderColor: Colors.cardBorderLight,
                                    padding: 14,
                                },
                                Shadows.card,
                            ]}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                <Text style={{ color: Colors.success, fontSize: 18, fontWeight: "800" }}>
                                    ₹{t.amount}
                                </Text>
                                <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
                                    {MONTH_NAMES[t.month - 1]} {t.year} · {t.payment_date}
                                </Text>
                            </View>
                            {t.remarks ? (
                                <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                                    {t.remarks}
                                </Text>
                            ) : null}
                        </View>
                    ))
                )}
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
        </ScreenWrapper>
    );
}
