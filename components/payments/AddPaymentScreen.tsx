import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { addPayment } from "../../services/payment.service";

interface Props {
    role: "ADMIN" | "TEACHER";
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function AddPaymentScreen({ role }: Props) {
    const { studentId } = useLocalSearchParams();
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const now = new Date();
    const currentMonth = MONTHS[now.getMonth()];

    const handleAddPayment = async () => {
        if (!amount) {
            Alert.alert("Missing amount", "Please enter the payment amount.");
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
            if (error) {
                Alert.alert("Error", error.message);
                return;
            }
            Alert.alert("Payment Recorded ✅", "Payment has been added successfully.");
            router.back();
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to add payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 48 }}
                >
                    {/* Header */}
                    <View className="px-5 pt-6 pb-4">
                        <Pressable
                            onPress={() => router.back()}
                            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                            className="mb-6 flex-row items-center"
                        >
                            <Text className="text-indigo-400 text-base">← Back</Text>
                        </Pressable>
                        <Text className="text-2xl font-bold text-white">Record Payment</Text>
                        <Text className="mt-1 text-sm text-slate-400">
                            Payment will be recorded for {currentMonth} {now.getFullYear()}
                        </Text>
                    </View>

                    <View className="px-5">
                        {/* Amount Input — Hero style */}
                        <View className="mb-5 rounded-2xl bg-slate-800 p-5">
                            <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                                Amount Received
                            </Text>
                            <View className="mt-3 flex-row items-center">
                                <Text className="mr-2 text-4xl font-bold text-slate-600">₹</Text>
                                <TextInput
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0"
                                    placeholderTextColor="#334155"
                                    keyboardType="numeric"
                                    autoFocus
                                    className="flex-1 text-4xl font-bold text-white"
                                />
                            </View>
                            <View className="mt-4 h-px bg-slate-700" />
                            <Text className="mt-3 text-xs text-slate-500">
                                Enter the exact amount collected in rupees
                            </Text>
                        </View>

                        {/* Period — auto-filled, read-only display */}
                        <View className="mb-5 rounded-2xl bg-slate-800 p-5">
                            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                                Payment Period
                            </Text>
                            <View className="flex-row gap-3">
                                <View className="flex-1 rounded-xl bg-slate-700 px-4 py-3">
                                    <Text className="text-xs text-slate-500">Month</Text>
                                    <Text className="mt-0.5 font-semibold text-white">{currentMonth}</Text>
                                </View>
                                <View className="flex-1 rounded-xl bg-slate-700 px-4 py-3">
                                    <Text className="text-xs text-slate-500">Year</Text>
                                    <Text className="mt-0.5 font-semibold text-white">{now.getFullYear()}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Note */}
                        <View className="mb-6 rounded-2xl bg-slate-800 p-5">
                            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                                Note
                                <Text className="ml-2 normal-case tracking-normal text-slate-600"> (optional)</Text>
                            </Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="e.g. Cash, partial payment, advance..."
                                placeholderTextColor="#475569"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                className="min-h-[72px] rounded-xl border border-slate-700 bg-slate-700/50 px-4 py-3 text-sm text-white"
                            />
                        </View>

                        {/* CTA */}
                        <Pressable
                            onPress={handleAddPayment}
                            disabled={loading}
                            style={({ pressed }) => ({ opacity: pressed || loading ? 0.7 : 1 })}
                            className="items-center rounded-2xl bg-indigo-600 py-4"
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-base font-bold text-white">Confirm Payment</Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}