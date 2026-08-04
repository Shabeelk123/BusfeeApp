import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { Colors, Shadows } from "../../constants/colors";
import { supabase } from "../../lib/supabase";
import { collectPayment, getStudentMonthFee } from "../../services/payment.service";
import { getStudentById } from "../../services/student.service";
import PageHeader from "../common/PageHeader";
import ScreenWrapper from "../common/ScreenWrapper";
import { useToast } from "../common/ToastContext";

// ─── Constants ────────────────────────────────────────────────────────────────

interface Props {
    role: "ADMIN" | "CLASS";
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const QUICK_AMOUNTS = ["500", "1000", "1500", "2000", "2500", "3000"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoPill({ label, value, tone = "neutral" }: {
    label: string;
    value: string;
    tone?: "neutral" | "danger" | "success" | "warning";
}) {
    const colorMap = {
        neutral: { bg: Colors.inputBg, text: Colors.textPrimary, label: Colors.textMuted },
        danger:  { bg: Colors.dangerLight, text: Colors.danger, label: Colors.danger },
        success: { bg: Colors.successLight, text: Colors.success, label: Colors.success },
        warning: { bg: Colors.warningLight, text: Colors.warning, label: Colors.warning },
    };
    const c = colorMap[tone];
    return (
        <View style={{ flex: 1, borderRadius: 12, backgroundColor: c.bg, padding: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: c.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: c.text }} numberOfLines={1}>
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

    const remaining = Math.max(0, fee - paidAmount);

    // ── Load this month's fee status ──────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [{ data: student }, { data: smf }] = await Promise.all([
                getStudentById(studentId),
                getStudentMonthFee(studentId, monthNum, yearNum),
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
    }, [studentId, monthNum, yearNum]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

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
                month: monthNum,
                year: yearNum,
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
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 14 }}>
                        Loading student fee details...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    // ── Render: main ──────────────────────────────────────────────────────────
    return (
        <ScreenWrapper>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* ── Header ── */}
                <PageHeader
                    title="Collect Payment"
                    subtitle={`${studentName || "Student"} · ${MONTHS[monthNum - 1]} ${yearNum}`}
                    showBack
                />

                {/* ── Month Info Strip ── */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                    <InfoPill label="Monthly Fee" value={`₹${fee.toLocaleString()}`} />
                    <InfoPill label="Paid So Far" value={`₹${paidAmount.toLocaleString()}`} tone="success" />
                    <InfoPill label="Remaining" value={`₹${remaining.toLocaleString()}`} tone={outstandingTone} />
                </View>

                {/* ── Amount Entry Hero Card ── */}
                <View
                    style={[
                        {
                            borderRadius: 20,
                            backgroundColor: Colors.primary,
                            padding: 24,
                            marginBottom: 16,
                            alignItems: "center",
                        },
                        Shadows.cardMd,
                    ]}
                >
                    <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
                        Amount Received
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 42, fontWeight: "800", color: "rgba(255,255,255,0.5)", marginRight: 4, lineHeight: 52 }}>
                            ₹
                        </Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            keyboardType="numeric"
                            style={{ fontSize: 52, fontWeight: "900", color: Colors.textOnDark, minWidth: 60, letterSpacing: -1 }}
                        />
                    </View>

                    <View style={{ marginTop: 16, height: 1, width: "100%", backgroundColor: "rgba(255,255,255,0.2)" }} />
                    <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.65)" />
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                            Paying for: {MONTHS[monthNum - 1]} {yearNum}
                        </Text>
                    </View>
                </View>

                {/* ── Quick Amount Chips ── */}
                <View style={[{ backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorderLight }, Shadows.card]}>
                    <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: Colors.textMuted, marginBottom: 12 }}>
                        Quick Select
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {QUICK_AMOUNTS.map((q) => {
                            const isSelected = amount === q;
                            return (
                                <Pressable
                                    key={q}
                                    onPress={() => setAmount(q)}
                                    style={({ pressed }) => ({
                                        paddingHorizontal: 16,
                                        paddingVertical: 9,
                                        borderRadius: 999,
                                        borderWidth: 1.5,
                                        borderColor: isSelected ? Colors.primary : Colors.cardBorder,
                                        backgroundColor: isSelected ? Colors.primaryLight : Colors.inputBg,
                                        opacity: pressed ? 0.75 : 1,
                                    })}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Set amount to ₹${q}`}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: "700", color: isSelected ? Colors.primary : Colors.textSecondary }}>
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
                                    paddingHorizontal: 16,
                                    paddingVertical: 9,
                                    borderRadius: 999,
                                    borderWidth: 1.5,
                                    borderColor: amount === String(remaining) ? Colors.primary : Colors.successBorder,
                                    backgroundColor: amount === String(remaining) ? Colors.primaryLight : Colors.successLight,
                                    opacity: pressed ? 0.75 : 1,
                                })}
                                accessibilityRole="button"
                                accessibilityLabel="Pay full remaining amount"
                            >
                                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.success }}>
                                    ₹{remaining.toLocaleString()} (full)
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* ── Existing transactions this month ── */}
                {transactions.length > 0 && (
                    <View style={[{ backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorderLight }, Shadows.card]}>
                        <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: Colors.textMuted, marginBottom: 12 }}>
                            Payments This Month
                        </Text>
                        {transactions.map((t) => (
                            <View key={t.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.cardBorderLight }}>
                                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                                    {t.payment_date}{t.remarks ? ` · ${t.remarks}` : ""}
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.success }}>
                                    ₹{t.amount}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Note ── */}
                <View style={[{ backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorderLight }, Shadows.card]}>
                    <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: Colors.textMuted, marginBottom: 12 }}>
                        Note{" "}
                        <Text style={{ textTransform: "none", letterSpacing: 0, fontSize: 11, color: Colors.textDisabled, fontWeight: "400" }}>
                            (optional)
                        </Text>
                    </Text>
                    <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="e.g. Cash payment, partial, advance..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        style={{
                            minHeight: 72,
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: Colors.inputBorder,
                            backgroundColor: Colors.inputBg,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            fontSize: 14,
                            color: Colors.textPrimary,
                            lineHeight: 20,
                        }}
                    />
                </View>

                {/* ── Submit ── */}
                <Pressable
                    onPress={handleCollect}
                    disabled={submitting}
                    style={({ pressed }) => ({
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: Colors.primary,
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
                        <ActivityIndicator color={Colors.textOnDark} />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textOnDark} />
                            <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.textOnDark }}>
                                Collect Payment
                            </Text>
                        </>
                    )}
                </Pressable>
            </ScrollView>

            {/* ── Success Modal ── */}
            <Modal
                visible={successAmount !== null}
                transparent
                animationType="fade"
                onRequestClose={handleSuccessClose}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: Colors.card, borderRadius: 24, padding: 24 }}>
                        <View style={{ alignItems: "center", marginBottom: 16 }}>
                            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.successLight, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="checkmark-circle" size={42} color={Colors.success} />
                            </View>
                        </View>

                        <Text style={{ fontSize: 22, fontWeight: "900", color: Colors.textPrimary, textAlign: "center", marginBottom: 4 }}>
                            Payment Collected
                        </Text>
                        <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: "center", marginBottom: 20 }}>
                            {studentName}
                        </Text>

                        <View style={{ backgroundColor: Colors.inputBg, borderRadius: 14, padding: 14, marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.textPrimary }}>
                                    {MONTHS[monthNum - 1]} {yearNum}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.success }}>
                                    ₹{(successAmount ?? 0).toLocaleString()}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.cardBorderLight }}>
                                <Text style={{ fontSize: 13, color: Colors.textMuted }}>Remaining Balance</Text>
                                <Text style={{ fontSize: 13, fontWeight: "700", color: Math.max(0, fee - paidAmount) > 0 ? Colors.danger : Colors.success }}>
                                    ₹{Math.max(0, fee - paidAmount).toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={handleSuccessClose}
                            style={({ pressed }) => ({
                                height: 52,
                                borderRadius: 14,
                                backgroundColor: Colors.primary,
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: pressed ? 0.8 : 1,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Done"
                        >
                            <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.textOnDark }}>
                                Done
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
}
