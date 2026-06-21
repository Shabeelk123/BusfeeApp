import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

export default function AddPaymentScreen({ role }: Props) {
    const toast = useToast();
    const { studentId } = useLocalSearchParams();
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const now = new Date();
    const currentMonth = MONTHS[now.getMonth()];

    const handleAddPayment = async () => {
        if (!amount) {
            toast.warning("Missing Amount", "Please enter the payment amount.");
            return;
        }
        try {
            setLoading(true);
            const { error } = await addPayment({
                student_id: studentId as string,
                amount: Number(amount),
                payment_month: now.getMonth() + 1,
                payment_year: now.getFullYear(),
                note,
            });
            if (error) { toast.error("Payment Failed", error.message); return; }
            toast.success("Payment Added", "Payment has been recorded successfully.");
            router.back();
        } catch {
            toast.error("Network Error", "Failed to add payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
                >
                    {/* Back */}
                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            alignSelf: "flex-start",
                            backgroundColor: Colors.card,
                            borderRadius: 10,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginBottom: 20,
                            opacity: pressed ? 0.7 : 1,
                            ...Shadows.card,
                        })}
                    >
                        <Ionicons name="arrow-back" size={16} color={Colors.primary} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary }}>Back</Text>
                    </Pressable>

                    {/* Header */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 24, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.5 }}>
                            Record Payment
                        </Text>
                        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
                            Recording for {currentMonth} {now.getFullYear()}
                        </Text>
                    </View>

                    {/* Amount hero card */}
                    <View
                        style={[
                            { borderRadius: 16, backgroundColor: Colors.card, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorderLight },
                            Shadows.cardMd,
                        ]}
                    >
                        <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: Colors.textMuted, marginBottom: 12 }}>
                            Amount Received
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 40, fontWeight: "800", color: Colors.textMuted, marginRight: 6 }}>₹</Text>
                            <Pressable style={{ flex: 1 }}>
                                <View style={{ borderBottomWidth: 2, borderBottomColor: Colors.primary }}>
                                    <Text
                                        onPress={() => {}}
                                        style={{ fontSize: 40, fontWeight: "800", color: amount ? Colors.textPrimary : Colors.textDisabled }}
                                        suppressHighlighting
                                    >
                                        {/* We still use a real TextInput for this field */}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                        {/* Real input layered */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: -48 }}>
                            <Text style={{ fontSize: 40, fontWeight: "800", color: Colors.textMuted, marginRight: 6, opacity: 0 }}>₹</Text>
                            <View style={{ flex: 1 }}>
                                <import_TextInput
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0"
                                    placeholderTextColor={Colors.textDisabled}
                                    keyboardType="numeric"
                                    autoFocus
                                    style={{ fontSize: 40, fontWeight: "800", color: Colors.textPrimary, flex: 1 }}
                                />
                            </View>
                        </View>
                        <View style={{ height: 1, backgroundColor: Colors.cardBorder, marginTop: 12 }} />
                        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 8 }}>
                            Enter the exact amount collected in rupees
                        </Text>
                    </View>

                    {/* Period */}
                    <View style={[{ borderRadius: 16, backgroundColor: Colors.card, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorderLight }, Shadows.card]}>
                        <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: Colors.textMuted, marginBottom: 14 }}>
                            Payment Period
                        </Text>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <View style={{ flex: 1, borderRadius: 10, backgroundColor: Colors.inputBg, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.inputBorder }}>
                                <Text style={{ fontSize: 11, color: Colors.textMuted }}>Month</Text>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.textPrimary, marginTop: 2 }}>{currentMonth}</Text>
                            </View>
                            <View style={{ flex: 1, borderRadius: 10, backgroundColor: Colors.inputBg, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.inputBorder }}>
                                <Text style={{ fontSize: 11, color: Colors.textMuted }}>Year</Text>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.textPrimary, marginTop: 2 }}>{now.getFullYear()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Note */}
                    <View style={[{ borderRadius: 16, backgroundColor: Colors.card, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.cardBorderLight }, Shadows.card]}>
                        <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: Colors.textMuted, marginBottom: 14 }}>
                            Note <Text style={{ textTransform: "none", letterSpacing: 0, fontSize: 11, color: Colors.textDisabled, fontWeight: "400" }}>(optional)</Text>
                        </Text>
                        <import_TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="e.g. Cash, partial payment, advance..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{
                                minHeight: 72,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: Colors.inputBorder,
                                backgroundColor: Colors.inputBg,
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                fontSize: 14,
                                color: Colors.textPrimary,
                            }}
                        />
                    </View>

                    {/* CTA */}
                    <Pressable
                        onPress={handleAddPayment}
                        disabled={loading}
                        style={({ pressed }) => ({
                            height: 52,
                            borderRadius: 14,
                            backgroundColor: loading ? Colors.primaryDark : Colors.primary,
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: pressed || loading ? 0.75 : 1,
                        })}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.textOnDark} />
                        ) : (
                            <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.textOnDark }}>
                                Confirm Payment
                            </Text>
                        )}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}