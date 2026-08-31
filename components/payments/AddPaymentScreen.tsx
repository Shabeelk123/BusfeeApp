import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { supabase } from "../../lib/supabase";
import { collectPayment, getStudentFeeLedger, getStudentMonthFee } from "../../services/payment.service";
import { getStudentById } from "../../services/student.service";
import { ACADEMIC_MONTH_SET, formatAcademicMonth } from "../../utils/academicYear";
import AcademicMonthSelect from "../common/AcademicMonthSelect";
import PageHeader from "../common/PageHeader";
import ScreenWrapper from "../common/ScreenWrapper";
import { useToast } from "../common/ToastContext";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background:  "#f7fafc",
    navy:        "#1a2b48",
    navyLight:   "#e8ebf2",
    onSurface:   "#181c1e",
    onSurfaceVariant: "#44474d",
    outline:     "#e2e8f0",
    inputBg:     "#f7fafc",
    success:     "#2d7a4d",
    successLight:"#e3f3e9",
    warning:     "#b7791f",
    warningLight:"#fdf3e0",
    danger:      "#e53e3e",
    dangerLight: "#fdeaea",
} as const;

// ─── Constants ────────────────────────────────────────────────────────────────

interface Props {
    role: "ADMIN" | "CLASS";
}

const QUICK_AMOUNTS = ["500", "1000", "1500", "2000", "2500", "3000"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoPill({ label, value, tone = "neutral" }: {
    label: string;
    value: string;
    tone?: "neutral" | "danger" | "success" | "warning";
}) {
    const colorMap = {
        neutral: { bg: T.inputBg, text: T.onSurface, label: T.onSurfaceVariant },
        danger:  { bg: T.dangerLight, text: T.danger, label: T.danger },
        success: { bg: T.successLight, text: T.success, label: T.success },
        warning: { bg: T.warningLight, text: T.warning, label: T.warning },
    };
    const c = colorMap[tone];
    return (
        <View style={{ flex: 1, borderRadius: 12, backgroundColor: c.bg, padding: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: c.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "800", color: c.text }} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
// Collects a payment for ONE specific student_monthly_fees month, navigated
// to from a Monthly Fee Ledger row (StudentDetails) with studentId/month/year
// route params. Updates `student_monthly_fees` + inserts `fee_transactions`
// via payment.service.ts::collectPayment — shared by ADMIN and CLASS.
//
// CLASS gets an additional month picker (defaulting to the student's oldest
// unpaid academic month) because the dashboard month a CLASS account is
// looking at must not silently decide which month a payment posts to — see
// activeMonth/activeYear below. ADMIN's behavior is unchanged: it always
// uses the month/year passed in via route params, exactly as before.

export default function AddPaymentScreen({ role }: Props) {
    const toast = useToast();
    const { studentId, month, year } = useLocalSearchParams<{
        studentId: string;
        month: string;
        year: string;
    }>();

    const monthNum = Number(month);
    const yearNum = Number(year);

    // ── State ────────────────────────────────────────────────────────────────
    const [studentName, setStudentName] = useState<string>("");
    const [fee, setFee] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [successAmount, setSuccessAmount] = useState<number | null>(null);

    // The month/year the payment will actually post to. Starts out as
    // whichever ledger row the screen was opened from; CLASS may change it
    // via the month picker below (populated once the student's ledger loads).
    const [activeMonth, setActiveMonth] = useState(monthNum);
    const [activeYear, setActiveYear] = useState(yearNum);

    // CLASS-only: one-time smart default to the oldest unpaid academic month.
    const [appliedDefault, setAppliedDefault] = useState(false);

    const remaining = Math.max(0, fee - paidAmount);

    // ── Load this month's fee status ──────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [{ data: student }, { data: smf }] = await Promise.all([
                getStudentById(studentId),
                getStudentMonthFee(studentId, activeMonth, activeYear),
            ]);

            if (student) {
                setStudentName(student.name);
                setFee((smf as any)?.fee ?? student.monthly_fee ?? 0);
            } else {
                setFee((smf as any)?.fee ?? 0);
            }

            setPaidAmount((smf as any)?.paid_amount ?? 0);
            setTransactions((smf as any)?.fee_transactions ?? []);

            const stillDue = Math.max(0, ((smf as any)?.fee ?? student?.monthly_fee ?? 0) - ((smf as any)?.paid_amount ?? 0));
            setAmount(stillDue > 0 ? String(stillDue) : "");
        } finally {
            setLoading(false);
        }
    }, [studentId, activeMonth, activeYear]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    // ── CLASS-only: build the month picker + default to the oldest unpaid
    // academic month, falling back to the month the screen was opened with
    // (the dashboard/ledger context) if every month is already settled.
    useEffect(() => {
        if (role !== "CLASS" || !studentId || appliedDefault) return;

        (async () => {
            const { data: student } = await getStudentById(studentId);
            if (!student) { setAppliedDefault(true); return; }

            const { data: ledger } = await getStudentFeeLedger(
                student.id,
                student.monthly_fee,
                student.created_at,
            );

            // Ledger only covers past/current months — that's fine, we just
            // need it to find the oldest unpaid one. It is newest-first, so
            // the oldest unpaid month is the LAST Pending/Partial entry.
            const academic = ledger.filter((entry) => ACADEMIC_MONTH_SET.has(entry.month));
            const oldestUnpaid = [...academic].reverse().find(
                (entry) => entry.status === "Pending" || entry.status === "Partial",
            );

            if (oldestUnpaid) {
                setActiveMonth(oldestUnpaid.month);
                setActiveYear(oldestUnpaid.year);
            }
            // else: no pending months — keep the route-param month/year already set.

            setAppliedDefault(true);
        })();
    }, [role, studentId, appliedDefault]);

    // ── Collect payment ────────────────────────────────────────────────────────
    const handleCollect = async () => {
        const parsed = Number(amount);
        if (!amount.trim() || Number.isNaN(parsed) || parsed <= 0) {
            toast.warning("Invalid Amount", "Please enter a valid payment amount.");
            return;
        }
        try {
            setSubmitting(true);

            const { data: { session } } = await supabase.auth.getSession();

            const { data, error } = await collectPayment({
                studentId,
                month: activeMonth,
                year: activeYear,
                amount: parsed,
                remarks: note.trim() || undefined,
                collectedBy: session?.user?.id,
            });

            if (error) {
                toast.error("Payment Failed", error.message || "Unable to record payment");
                return;
            }

            setPaidAmount(data?.paid_amount ?? paidAmount + parsed);
            setSuccessAmount(parsed);
        } catch {
            toast.error("Network Error", "Failed to record payment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessAmount(null);
        router.back();
    };

    const outstandingTone = remaining > 0 ? "danger" : "success";

    // ── Render: loading ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <ScreenWrapper backgroundColor={T.background}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={T.navy} />
                    <Text style={{ marginTop: 12, color: T.onSurfaceVariant, fontSize: 14 }}>
                        Loading student fee details...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    // ── Render: main ──────────────────────────────────────────────────────────
    return (
        <ScreenWrapper backgroundColor={T.background}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>
                    {/* ── Header ── */}
                    <PageHeader
                        title="Collect Payment"
                        subtitle={`${studentName || "Student"} · ${formatAcademicMonth({ month: activeMonth, year: activeYear })}`}
                        showBack
                    />

                    {/* ── Fee Month Picker (CLASS only) ── */}
                    {role === "CLASS" && (
                        <View style={{ marginBottom: 4 }}>
                            <AcademicMonthSelect
                                label="Fee Month"
                                value={{ month: activeMonth, year: activeYear }}
                                onChange={(m) => { setActiveMonth(m.month); setActiveYear(m.year); }}
                            />
                        </View>
                    )}

                    {/* ── Month Info Strip ── */}
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                        <InfoPill label="Fee" value={`₹${fee.toLocaleString()}`} />
                        <InfoPill label="Paid" value={`₹${paidAmount.toLocaleString()}`} tone="success" />
                        <InfoPill label="Remaining" value={`₹${remaining.toLocaleString()}`} tone={outstandingTone} />
                    </View>

                    {/* ── Amount Entry Hero Card ── */}
                    <View
                        style={{
                            borderRadius: 18,
                            backgroundColor: T.navy,
                            paddingVertical: 18,
                            paddingHorizontal: 20,
                            marginBottom: 12,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
                            Amount Received
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 34, fontWeight: "800", color: "rgba(255,255,255,0.5)", marginRight: 3, lineHeight: 42 }}>
                                ₹
                            </Text>
                            <TextInput
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0"
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                keyboardType="numeric"
                                style={{ fontSize: 40, fontWeight: "900", color: "#ffffff", minWidth: 50, letterSpacing: -1 }}
                            />
                        </View>
                    </View>

                    {/* ── Quick Amounts + Note (one card) ── */}
                    <View style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.outline }}>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                            {QUICK_AMOUNTS.map((q) => {
                                const isSelected = amount === q;
                                return (
                                    <Pressable
                                        key={q}
                                        onPress={() => setAmount(q)}
                                        style={({ pressed }) => ({
                                            paddingHorizontal: 14,
                                            paddingVertical: 8,
                                            borderRadius: 999,
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? T.navy : T.outline,
                                            backgroundColor: isSelected ? T.navyLight : T.inputBg,
                                            opacity: pressed ? 0.75 : 1,
                                        })}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Set amount to ₹${q}`}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? T.navy : T.onSurfaceVariant }}>
                                            ₹{q}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                            {/* Full remaining shortcut */}
                            {remaining > 0 && !QUICK_AMOUNTS.includes(String(remaining)) && (
                                <Pressable
                                    onPress={() => setAmount(String(remaining))}
                                    style={({ pressed }) => ({
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 999,
                                        borderWidth: 1.5,
                                        borderColor: amount === String(remaining) ? T.navy : T.success,
                                        backgroundColor: amount === String(remaining) ? T.navyLight : T.successLight,
                                        opacity: pressed ? 0.75 : 1,
                                    })}
                                    accessibilityRole="button"
                                    accessibilityLabel="Pay full remaining amount"
                                >
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: T.success }}>
                                        ₹{remaining.toLocaleString()} (full)
                                    </Text>
                                </Pressable>
                            )}
                        </View>

                        <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="Note (optional) — e.g. cash, partial, advance..."
                            placeholderTextColor={T.onSurfaceVariant}
                            multiline
                            numberOfLines={2}
                            textAlignVertical="top"
                            style={{
                                minHeight: 44,
                                borderRadius: 10,
                                borderWidth: 1.5,
                                borderColor: T.outline,
                                backgroundColor: T.inputBg,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                fontSize: 13,
                                color: T.onSurface,
                                lineHeight: 18,
                            }}
                        />
                    </View>

                    {/* ── Existing transactions this month ── */}
                    {transactions.length > 0 && (
                        <View style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.outline }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: T.onSurfaceVariant, marginBottom: 8 }}>
                                Payments This Month
                            </Text>
                            {transactions.map((t) => (
                                <View key={t.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: T.outline }}>
                                    <Text style={{ fontSize: 12, color: T.onSurfaceVariant }}>
                                        {t.payment_date}{t.remarks ? ` · ${t.remarks}` : ""}
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: T.success }}>
                                        ₹{t.amount}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ── Submit ── */}
                    <Pressable
                        onPress={handleCollect}
                        disabled={submitting}
                        style={({ pressed }) => ({
                            height: 52,
                            borderRadius: 14,
                            backgroundColor: T.navy,
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "row",
                            gap: 8,
                            opacity: pressed || submitting ? 0.7 : 1,
                        })}
                        accessibilityRole="button"
                        accessibilityLabel="Collect payment"
                    >
                        {submitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#ffffff" }}>
                                    Collect Payment
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </ScrollView>

            {/* ── Success Modal ── */}
            <Modal
                visible={successAmount !== null}
                transparent
                animationType="fade"
                onRequestClose={handleSuccessClose}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: "#ffffff", borderRadius: 24, padding: 24 }}>
                        <View style={{ alignItems: "center", marginBottom: 16 }}>
                            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: T.successLight, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="checkmark-circle" size={42} color={T.success} />
                            </View>
                        </View>

                        <Text style={{ fontSize: 22, fontWeight: "900", color: T.onSurface, textAlign: "center", marginBottom: 4 }}>
                            Payment Collected
                        </Text>
                        <Text style={{ fontSize: 13, color: T.onSurfaceVariant, textAlign: "center", marginBottom: 20 }}>
                            {studentName}
                        </Text>

                        <View style={{ backgroundColor: T.inputBg, borderRadius: 14, padding: 14, marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: T.onSurface }}>
                                    {formatAcademicMonth({ month: activeMonth, year: activeYear })}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "800", color: T.success }}>
                                    ₹{(successAmount ?? 0).toLocaleString()}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: T.outline }}>
                                <Text style={{ fontSize: 13, color: T.onSurfaceVariant }}>Remaining Balance</Text>
                                <Text style={{ fontSize: 13, fontWeight: "700", color: Math.max(0, fee - paidAmount) > 0 ? T.danger : T.success }}>
                                    ₹{Math.max(0, fee - paidAmount).toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={handleSuccessClose}
                            style={({ pressed }) => ({
                                height: 52,
                                borderRadius: 14,
                                backgroundColor: T.navy,
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: pressed ? 0.8 : 1,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Done"
                        >
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                                Done
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
}
