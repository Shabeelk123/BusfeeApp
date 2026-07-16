import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
    collectPayment,
    FeeStatusResult,
    getStudentFeeStatus,
    PaymentAllocation,
} from "../../services/payment.service";
import { MonthEntry } from "../../utils/monthlyFeeStatus";
import PageHeader from "../common/PageHeader";
import ScreenWrapper from "../common/ScreenWrapper";
import { useToast } from "../common/ToastContext";

// ─── Constants ────────────────────────────────────────────────────────────────

interface Props {
    role: "ADMIN" | "TEACHER";
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const QUICK_AMOUNTS = ["500", "1000", "1500", "2000", "2500", "3000"];

// ─── Helper: compute live payment preview ────────────────────────────────────

function computePreview(
    amount: number,
    feeStatus: FeeStatusResult,
    overrideMonth?: number,
    overrideYear?: number,
): { allocations: { month: number; year: number; give: number; needed: number }[]; advance: number } {
    if (amount <= 0 || !feeStatus) return { allocations: [], advance: 0 };

    const today = new Date();
    // Build a future-extended ledger for advance preview (12 months ahead)
    const futureMonths: MonthEntry[] = [];
    const existingMonths = feeStatus.months;

    // Add 12 months beyond the last ledger entry
    const last = existingMonths[existingMonths.length - 1];
    if (last) {
        let cur = new Date(last.year, last.month, 1); // month is 1-based → JS month = last.month
        for (let i = 0; i < 12; i++) {
            futureMonths.push({
                month: cur.getMonth() + 1,
                year: cur.getFullYear(),
                expected: feeStatus.monthlyFee,
                paid: 0,
                status: "PENDING",
            });
            cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }
    }

    const fullLedger = [...existingMonths, ...futureMonths];

    let startIndex = 0;
    if (overrideMonth && overrideYear) {
        const idx = fullLedger.findIndex(
            (m) => m.month === overrideMonth && m.year === overrideYear
        );
        if (idx >= 0) startIndex = idx;
    } else {
        const idx = fullLedger.findIndex((m) => m.status !== "PAID");
        startIndex = idx >= 0 ? idx : fullLedger.length;
    }

    const allocations: { month: number; year: number; give: number; needed: number }[] = [];
    let remaining = amount;

    for (let i = startIndex; i < fullLedger.length && remaining > 0; i++) {
        const entry = fullLedger[i];
        const needed = entry.expected - entry.paid;
        if (needed <= 0) continue;

        const give = Math.min(remaining, needed);
        remaining -= give;
        allocations.push({ month: entry.month, year: entry.year, give, needed });
    }

    return { allocations, advance: remaining };
}

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

function AllocationRow({ month, year, give, needed }: {
    month: number; year: number; give: number; needed: number;
}) {
    const full = give >= needed;
    return (
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorderLight }}>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>
                    {MONTHS[month - 1]} {year}
                </Text>
                {!full && (
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>
                        Remaining after: ₹{(needed - give).toLocaleString()}
                    </Text>
                )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: full ? Colors.success : Colors.warning }}>
                    ₹{give.toLocaleString()}
                </Text>
                <View style={{
                    borderRadius: 999,
                    backgroundColor: full ? Colors.successLight : Colors.warningLight,
                    paddingHorizontal: 8, paddingVertical: 3,
                }}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: full ? Colors.success : Colors.warning }}>
                        {full ? "FULL" : "PART"}
                    </Text>
                </View>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddPaymentScreen({ role }: Props) {
    const toast = useToast();
    const { studentId } = useLocalSearchParams();

    // ── State ────────────────────────────────────────────────────────────────
    const [feeStatus, setFeeStatus] = useState<FeeStatusResult | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Advanced override
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [overrideMonth, setOverrideMonth] = useState<number | undefined>();
    const [overrideYear, setOverrideYear] = useState<number | undefined>();
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // Post-payment success modal
    const [successData, setSuccessData] = useState<{
        allocations: PaymentAllocation[];
        advance: number;
    } | null>(null);

    const amountRef = useRef<TextInput>(null);

    // ── Load fee status ───────────────────────────────────────────────────────
    const loadFeeStatus = useCallback(async () => {
        setLoadingStatus(true);
        const { data } = await getStudentFeeStatus(studentId as string);
        if (data) {
            setFeeStatus(data);
            // Pre-fill amount with what's needed for the oldest pending month
            if (data.oldestPendingMonth) {
                setAmount(String(data.oldestPendingMonth.remaining));
            }
        }
        setLoadingStatus(false);
    }, [studentId]);

    useFocusEffect(useCallback(() => { loadFeeStatus(); }, [loadFeeStatus]));

    // ── Live preview ──────────────────────────────────────────────────────────
    const parsed = Number(amount);
    const preview = useMemo(() => {
        if (!feeStatus || isNaN(parsed) || parsed <= 0) return null;
        return computePreview(parsed, feeStatus, overrideMonth, overrideYear);
    }, [parsed, feeStatus, overrideMonth, overrideYear]);

    // ── Collect payment ────────────────────────────────────────────────────────
    const handleCollect = async () => {
        if (!amount.trim() || isNaN(parsed) || parsed <= 0) {
            toast.warning("Invalid Amount", "Please enter a valid payment amount.");
            return;
        }
        try {
            setSubmitting(true);
            const result = await collectPayment({
                studentId: studentId as string,
                amount: parsed,
                overrideMonth,
                overrideYear,
                note: note.trim() || undefined,
            });

            if (result.error) {
                toast.error("Payment Failed", result.error);
                return;
            }

            setSuccessData({ allocations: result.allocations, advance: result.advanceAdded });
        } catch {
            toast.error("Network Error", "Failed to record payment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessData(null);
        router.back();
    };

    // ── Derived display values ────────────────────────────────────────────────
    const payingForLabel = overrideMonth && overrideYear
        ? `${MONTHS[overrideMonth - 1]} ${overrideYear} (override)`
        : feeStatus?.oldestPendingMonth
            ? `${MONTHS[(feeStatus.oldestPendingMonth.month) - 1]} ${feeStatus.oldestPendingMonth.year} (auto)`
            : "No pending month";

    const outstandingTone = (feeStatus?.totalOutstanding || 0) > 0 ? "danger" : "success";

    // ── Render: loading ───────────────────────────────────────────────────────
    if (loadingStatus) {
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
                    subtitle={feeStatus?.studentName ?? "Student"}
                    showBack
                />

                {/* ── Student Info Strip ── */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                    <InfoPill
                        label="Monthly Fee"
                        value={`₹${(feeStatus?.monthlyFee || 0).toLocaleString()}`}
                    />
                    <InfoPill
                        label="Outstanding"
                        value={`₹${(feeStatus?.totalOutstanding || 0).toLocaleString()}`}
                        tone={outstandingTone}
                    />
                    {(feeStatus?.advanceBalance || 0) > 0 && (
                        <InfoPill
                            label="Advance"
                            value={`₹${feeStatus!.advanceBalance.toLocaleString()}`}
                            tone="success"
                        />
                    )}
                </View>

                {/* ── Amount Entry Hero Card ── */}
                <Pressable
                    onPress={() => amountRef.current?.focus()}
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
                    accessibilityRole="button"
                    accessibilityLabel="Tap to enter amount"
                >
                    <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
                        Amount Received
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 42, fontWeight: "800", color: "rgba(255,255,255,0.5)", marginRight: 4, lineHeight: 52 }}>
                            ₹
                        </Text>
                        <TextInput
                            ref={amountRef}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            keyboardType="numeric"
                            style={{ fontSize: 52, fontWeight: "900", color: Colors.textOnDark, minWidth: 60, letterSpacing: -1 }}
                        />
                    </View>

                    {/* Paying for label */}
                    <View style={{ marginTop: 16, height: 1, width: "100%", backgroundColor: "rgba(255,255,255,0.2)" }} />
                    <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.65)" />
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                            Paying for: {payingForLabel}
                        </Text>
                    </View>
                </Pressable>

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
                        {/* Full payment shortcut */}
                        {(feeStatus?.oldestPendingMonth?.remaining || 0) > 0 && !QUICK_AMOUNTS.includes(String(feeStatus?.oldestPendingMonth?.remaining)) && (
                            <Pressable
                                onPress={() => setAmount(String(feeStatus?.oldestPendingMonth?.remaining))}
                                style={({ pressed }) => ({
                                    paddingHorizontal: 16,
                                    paddingVertical: 9,
                                    borderRadius: 999,
                                    borderWidth: 1.5,
                                    borderColor: amount === String(feeStatus?.oldestPendingMonth?.remaining) ? Colors.primary : Colors.successBorder,
                                    backgroundColor: amount === String(feeStatus?.oldestPendingMonth?.remaining) ? Colors.primaryLight : Colors.successLight,
                                    opacity: pressed ? 0.75 : 1,
                                })}
                                accessibilityRole="button"
                                accessibilityLabel="Pay full pending amount"
                            >
                                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.success }}>
                                    ₹{feeStatus?.oldestPendingMonth?.remaining.toLocaleString()} (due)
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* ── Live Payment Preview ── */}
                {preview && preview.allocations.length > 0 && (
                    <View style={[{ backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorderLight }, Shadows.card]}>
                        <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: Colors.textMuted, marginBottom: 12 }}>
                            Payment Summary
                        </Text>
                        {preview.allocations.map((alloc, idx) => (
                            <AllocationRow
                                key={`${alloc.month}-${alloc.year}-${idx}`}
                                month={alloc.month}
                                year={alloc.year}
                                give={alloc.give}
                                needed={alloc.needed}
                            />
                        ))}
                        {preview.advance > 0 && (
                            <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 8, gap: 6 }}>
                                <Ionicons name="arrow-forward-circle-outline" size={16} color={Colors.primary} />
                                <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: "700" }}>
                                    ₹{preview.advance.toLocaleString()} will be added as advance credit
                                </Text>
                            </View>
                        )}
                        {/* Remaining outstanding after this payment */}
                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.cardBorderLight, flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: "600" }}>Remaining Due After Payment</Text>
                            <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.textPrimary }}>
                                ₹{Math.max(0, (feeStatus?.totalOutstanding || 0) - parsed).toLocaleString()}
                            </Text>
                        </View>
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

                {/* ── Advanced Override ── */}
                <Pressable
                    onPress={() => setShowAdvanced((v) => !v)}
                    style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                        opacity: pressed ? 0.7 : 1,
                        alignSelf: "flex-start",
                    })}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle advanced options"
                >
                    <Ionicons
                        name={showAdvanced ? "chevron-down-circle-outline" : "chevron-forward-circle-outline"}
                        size={18}
                        color={Colors.textSecondary}
                    />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.textSecondary }}>
                        Advanced: Override Payment Month
                    </Text>
                </Pressable>

                {showAdvanced && (
                    <View style={[{ backgroundColor: Colors.warningLight, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.warningBorder }, Shadows.card]}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.warning, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                            ⚠ Advanced — Only change if required
                        </Text>
                        <Text style={{ fontSize: 12, color: Colors.warning, marginBottom: 14, lineHeight: 18 }}>
                            By default the system auto-selects the oldest unpaid month. Only override if you need to allocate to a specific month.
                        </Text>
                        <Pressable
                            onPress={() => setShowMonthPicker(true)}
                            style={({ pressed }) => ({
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: Colors.card,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: overrideMonth ? Colors.primary : Colors.cardBorder,
                                padding: 14,
                                gap: 10,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Select override month"
                        >
                            <Ionicons name="calendar-outline" size={18} color={overrideMonth ? Colors.primary : Colors.textMuted} />
                            <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: overrideMonth ? Colors.primary : Colors.textMuted }}>
                                {overrideMonth
                                    ? `${MONTHS[overrideMonth - 1]} ${overrideYear}`
                                    : "Tap to select month"}
                            </Text>
                            {overrideMonth && (
                                <Pressable
                                    onPress={() => { setOverrideMonth(undefined); setOverrideYear(undefined); }}
                                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
                                    accessibilityRole="button"
                                    accessibilityLabel="Clear override"
                                >
                                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                                </Pressable>
                            )}
                        </Pressable>
                    </View>
                )}

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

            {/* ── Month Picker Modal (for override) ── */}
            <Modal
                visible={showMonthPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowMonthPicker(false)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
                    onPress={() => setShowMonthPicker(false)}
                >
                    <Pressable
                        style={{ backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}
                        onPress={() => { }}
                    >
                        {/* Handle */}
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.cardBorder, alignSelf: "center", marginBottom: 20 }} />

                        <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.textPrimary, marginBottom: 4 }}>
                            Override Month
                        </Text>
                        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 20 }}>
                            Select the month to allocate this payment to
                        </Text>

                        {/* Show the student's actual ledger months for easy selection */}
                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                            {feeStatus?.months.map((m, idx) => {
                                const isSelected = overrideMonth === m.month && overrideYear === m.year;
                                const statusColor =
                                    m.status === "PAID" ? Colors.success
                                    : m.status === "PARTIAL" ? Colors.warning
                                    : Colors.danger;
                                return (
                                    <Pressable
                                        key={idx}
                                        onPress={() => {
                                            setOverrideMonth(m.month);
                                            setOverrideYear(m.year);
                                            setShowMonthPicker(false);
                                        }}
                                        style={({ pressed }) => ({
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingVertical: 12,
                                            paddingHorizontal: 14,
                                            borderRadius: 12,
                                            marginBottom: 6,
                                            backgroundColor: isSelected ? Colors.primaryLight : Colors.inputBg,
                                            borderWidth: 1,
                                            borderColor: isSelected ? Colors.primary : Colors.cardBorderLight,
                                            opacity: pressed ? 0.75 : 1,
                                        })}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${MONTHS[m.month - 1]} ${m.year}`}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>
                                                {MONTHS[m.month - 1]} {m.year}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>
                                                Paid ₹{m.paid} / ₹{m.expected}
                                            </Text>
                                        </View>
                                        <View style={{ borderRadius: 999, backgroundColor: m.status === "PAID" ? Colors.successLight : m.status === "PARTIAL" ? Colors.warningLight : Colors.dangerLight, paddingHorizontal: 10, paddingVertical: 4 }}>
                                            <Text style={{ fontSize: 10, fontWeight: "800", color: statusColor }}>
                                                {m.status}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ── Success Modal ── */}
            <Modal
                visible={!!successData}
                transparent
                animationType="fade"
                onRequestClose={handleSuccessClose}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: Colors.card, borderRadius: 24, padding: 24 }}>
                        {/* Icon */}
                        <View style={{ alignItems: "center", marginBottom: 16 }}>
                            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.successLight, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="checkmark-circle" size={42} color={Colors.success} />
                            </View>
                        </View>

                        <Text style={{ fontSize: 22, fontWeight: "900", color: Colors.textPrimary, textAlign: "center", marginBottom: 4 }}>
                            Payment Collected
                        </Text>
                        <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: "center", marginBottom: 20 }}>
                            {feeStatus?.studentName}
                        </Text>

                        {/* Allocations */}
                        <View style={{ backgroundColor: Colors.inputBg, borderRadius: 14, padding: 14, marginBottom: 16 }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                                Paid For
                            </Text>
                            {successData?.allocations.map((alloc, idx) => (
                                <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                                    <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.textPrimary }}>
                                        {MONTHS[alloc.month - 1]} {alloc.year}
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.success }}>
                                        ₹{alloc.amount.toLocaleString()}
                                    </Text>
                                </View>
                            ))}
                            {(successData?.advance || 0) > 0 && (
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.cardBorderLight }}>
                                    <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary }}>
                                        Advance Credit
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.primary }}>
                                        ₹{successData?.advance.toLocaleString()}
                                    </Text>
                                </View>
                            )}
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
