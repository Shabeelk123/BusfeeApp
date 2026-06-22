import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import PageHeader from "../common/PageHeader";
import ScreenWrapper from "../common/ScreenWrapper";
import { useToast } from "../common/ToastContext";
import { Colors, Shadows } from "../../constants/colors";
import { addPayment } from "../../services/payment.service";

interface Props {
    role: "ADMIN" | "TEACHER";
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ── Academic months (June → March, 0-based) ─────────────────────────────────
// June=5, July=6, ..., December=11, January=0, February=1, March=2
const ACADEMIC_MONTH_INDICES = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2];

/**
 * Returns the best default month index (0-based) for payment entry.
 * If the current calendar month falls within the academic period (Jun–Mar)
 * it is used directly. April & May are outside the academic period, so we
 * default to June (start of the new academic year).
 */
function getDefaultAcademicMonth(date: Date): number {
    const m = date.getMonth(); // 0-based
    return ACADEMIC_MONTH_INDICES.includes(m) ? m : 5; // 5 = June
}

// ── Quick-amount chips ────────────────────────────────────────────────────────
const QUICK_AMOUNTS = ["500", "1000", "1500", "2000", "2500", "3000"];

export default function AddPaymentScreen({ role }: Props) {
    const toast = useToast();
    const { studentId } = useLocalSearchParams();
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const amountRef = useRef<TextInput>(null);

    const now = new Date();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    // Snap to the academic period: if today is Apr/May (off-session) → June.
    // Jan–Mar belong to the current calendar year but the *previous* academic
    // start year, so the payment_year stays as the calendar year of the month.
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(getDefaultAcademicMonth(now));
    const [selectedYear, setSelectedYear] = useState(nowYear);

    const handleAddPayment = async () => {
        const parsed = Number(amount);
        if (!amount.trim() || isNaN(parsed) || parsed <= 0) {
            toast.warning("Invalid Amount", "Please enter a valid payment amount.");
            return;
        }
        try {
            setLoading(true);
            const { error } = await addPayment({
                student_id: studentId as string,
                amount: parsed,
                payment_month: selectedMonthIndex + 1, // 1-based
                payment_year: selectedYear,
                note,
            });
            if (error) {
                toast.error("Payment Failed", error.message);
                return;
            }
            toast.success("Payment Recorded", "Payment has been saved successfully.");
            router.back();
        } catch {
            toast.error("Network Error", "Failed to add payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Build year options: current academic year and previous
    const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

    return (
        <ScreenWrapper>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* ── Header ── */}
                <PageHeader
                    title="Record Payment"
                    subtitle={`${MONTHS[selectedMonthIndex]} ${selectedYear}`}
                    showBack
                />

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
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.6)",
                            marginBottom: 12,
                        }}
                    >
                        Amount Received
                    </Text>

                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 42,
                                fontWeight: "800",
                                color: "rgba(255,255,255,0.5)",
                                marginRight: 4,
                                lineHeight: 52,
                            }}
                        >
                            ₹
                        </Text>
                        <TextInput
                            ref={amountRef}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            keyboardType="numeric"
                            style={{
                                fontSize: 52,
                                fontWeight: "900",
                                color: Colors.textOnDark,
                                minWidth: 60,
                                letterSpacing: -1,
                            }}
                        />
                    </View>

                    <View
                        style={{
                            marginTop: 16,
                            height: 1,
                            width: "100%",
                            backgroundColor: "rgba(255,255,255,0.2)",
                        }}
                    />
                    <Text
                        style={{
                            marginTop: 10,
                            fontSize: 12,
                            color: "rgba(255,255,255,0.55)",
                        }}
                    >
                        Tap to enter amount in rupees
                    </Text>
                </Pressable>

                {/* ── Quick Amount Chips ── */}
                <View
                    style={[
                        {
                            backgroundColor: Colors.card,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: Colors.cardBorderLight,
                        },
                        Shadows.card,
                    ]}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            color: Colors.textMuted,
                            marginBottom: 12,
                        }}
                    >
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
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: "700",
                                            color: isSelected ? Colors.primary : Colors.textSecondary,
                                        }}
                                    >
                                        ₹{q}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* ── Payment Period ── */}
                <View
                    style={[
                        {
                            backgroundColor: Colors.card,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: Colors.cardBorderLight,
                        },
                        Shadows.card,
                    ]}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            color: Colors.textMuted,
                            marginBottom: 14,
                        }}
                    >
                        Payment Period
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        {/* Month selector */}
                        <Pressable
                            onPress={() => setShowMonthPicker(true)}
                            style={({ pressed }) => ({
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: Colors.primaryLight,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: Colors.primaryBorder,
                                padding: 12,
                                gap: 10,
                                opacity: pressed ? 0.8 : 1,
                            })}
                            accessibilityRole="button"
                            accessibilityLabel="Select payment month"
                        >
                            <View
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 10,
                                    backgroundColor: Colors.primary,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="calendar-outline" size={16} color="white" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: "500" }}>
                                    Month
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.primary, marginTop: 1 }}>
                                    {MONTHS[selectedMonthIndex]}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={14} color={Colors.primary} />
                        </Pressable>

                        {/* Year: display only — change via month picker modal */}
                        <View
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: Colors.primaryLight,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: Colors.primaryBorder,
                                padding: 12,
                                gap: 10,
                            }}
                        >
                            <View
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 10,
                                    backgroundColor: Colors.primary,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="time-outline" size={16} color="white" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: "500" }}>
                                    Year
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.primary, marginTop: 1 }}>
                                    {selectedYear}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Note ── */}
                <View
                    style={[
                        {
                            backgroundColor: Colors.card,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 24,
                            borderWidth: 1,
                            borderColor: Colors.cardBorderLight,
                        },
                        Shadows.card,
                    ]}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            color: Colors.textMuted,
                            marginBottom: 12,
                        }}
                    >
                        Note{" "}
                        <Text
                            style={{
                                textTransform: "none",
                                letterSpacing: 0,
                                fontSize: 11,
                                color: Colors.textDisabled,
                                fontWeight: "400",
                            }}
                        >
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
                    onPress={handleAddPayment}
                    disabled={loading}
                    style={({ pressed }) => ({
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: Colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        opacity: pressed || loading ? 0.7 : 1,
                    })}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm payment"
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.textOnDark} />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textOnDark} />
                            <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.textOnDark }}>
                                Confirm Payment
                            </Text>
                        </>
                    )}
                </Pressable>
            </ScrollView>

            {/* ── Month Picker Modal ── */}
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
                        style={{
                            backgroundColor: Colors.card,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            padding: 24,
                            paddingBottom: 40,
                        }}
                        onPress={() => {}} // Prevent dismissal when tapping inside
                    >
                        {/* Handle */}
                        <View
                            style={{
                                width: 40,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: Colors.cardBorder,
                                alignSelf: "center",
                                marginBottom: 20,
                            }}
                        />

                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "800",
                                color: Colors.textPrimary,
                                marginBottom: 4,
                            }}
                        >
                            Select Month
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                color: Colors.textSecondary,
                                marginBottom: 20,
                            }}
                        >
                            Choose the month this payment applies to
                        </Text>

                        {/* Month grid */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            {ACADEMIC_MONTH_INDICES.map((monthIdx) => {
                                const isSelected = selectedMonthIndex === monthIdx;
                                const isCurrentMonth = now.getMonth() === monthIdx;
                                return (
                                    <Pressable
                                        key={monthIdx}
                                        onPress={() => {
                                            setSelectedMonthIndex(monthIdx);
                                            setShowMonthPicker(false);
                                        }}
                                        style={({ pressed }) => ({
                                            width: "30%",
                                            paddingVertical: 14,
                                            borderRadius: 12,
                                            alignItems: "center",
                                            borderWidth: 1.5,
                                            borderColor: isSelected
                                                ? Colors.primary
                                                : Colors.cardBorder,
                                            backgroundColor: isSelected
                                                ? Colors.primary
                                                : Colors.inputBg,
                                            opacity: pressed ? 0.75 : 1,
                                        })}
                                        accessibilityRole="button"
                                        accessibilityLabel={MONTHS[monthIdx]}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: isSelected ? "800" : "600",
                                                color: isSelected
                                                    ? Colors.textOnDark
                                                    : Colors.textPrimary,
                                            }}
                                        >
                                            {MONTHS[monthIdx].slice(0, 3)}
                                        </Text>
                                        {isCurrentMonth && !isSelected && (
                                            <View
                                                style={{
                                                    width: 4,
                                                    height: 4,
                                                    borderRadius: 2,
                                                    backgroundColor: Colors.primary,
                                                    marginTop: 4,
                                                }}
                                            />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Year switcher inside modal */}
                        <View
                            style={{
                                marginTop: 20,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 20,
                            }}
                        >
                            <Pressable
                                onPress={() => setSelectedYear((y) => y - 1)}
                                style={({ pressed }) => ({
                                    padding: 8,
                                    opacity: pressed ? 0.6 : 1,
                                })}
                                accessibilityLabel="Previous year"
                            >
                                <Ionicons name="chevron-back" size={20} color={Colors.primary} />
                            </Pressable>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.textPrimary }}>
                                {selectedYear}
                            </Text>
                            <Pressable
                                onPress={() => setSelectedYear((y) => y + 1)}
                                style={({ pressed }) => ({
                                    padding: 8,
                                    opacity: pressed ? 0.6 : 1,
                                })}
                                accessibilityLabel="Next year"
                            >
                                <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScreenWrapper>
    );
}
