import { useState } from "react";
import {
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
import { router } from "expo-router";
import { createStudent } from "../../../services/student.service";
import { getCurrentUserProfile } from "../../../services/auth.service";

interface FieldProps {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: any;
    secureTextEntry?: boolean;
    autoCapitalize?: any;
    emoji?: string;
    required?: boolean;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, emoji, required }: FieldProps) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-slate-400">
                {emoji} {label}{required && <Text className="text-red-400"> *</Text>}
            </Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#64748b"
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize ?? "words"}
                className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-4 text-base text-white"
            />
        </View>
    );
}

export default function TeacherCreateStudentScreen() {
    const [fullName, setFullName] = useState("");
    const [admissionNo, setAdmissionNo] = useState("");
    const [parentName, setParentName] = useState("");
    const [phone, setPhone] = useState("");
    const [busRoute, setBusRoute] = useState("");
    const [monthlyFee, setMonthlyFee] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!fullName || !admissionNo || !monthlyFee || !email || !password) {
            Alert.alert("Missing fields", "Please fill in all required fields.");
            return;
        }

        try {
            setLoading(true);
            const profile = await getCurrentUserProfile();
            if (!profile) {
                Alert.alert("Error", "Teacher profile not found. Please log in again.");
                return;
            }

            const { error } = await createStudent({
                full_name: fullName,
                admission_no: admissionNo,
                parent_name: parentName,
                phone,
                class_name: profile.assigned_class,
                bus_route: busRoute,
                monthly_fee: Number(monthlyFee),
                email,
                password,
            });

            if (error) { Alert.alert("Error", error.message); return; }
            Alert.alert("Student Added ✅", "Student has been registered successfully.");
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to create student. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="px-5 pt-6">
                        <Pressable onPress={() => router.back()} className="mb-4">
                            <Text className="text-indigo-400">← Back</Text>
                        </Pressable>
                        <Text className="mb-1 text-2xl font-bold text-white">Register Student</Text>
                        <Text className="mb-6 text-sm text-slate-400">Add a student to your class</Text>

                        {/* Personal Info */}
                        <View className="mb-4 rounded-2xl bg-slate-800 p-5">
                            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Personal Information</Text>
                            <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="e.g. Rahul Kumar" required emoji="👤" />
                            <Field label="Admission Number" value={admissionNo} onChangeText={setAdmissionNo} placeholder="e.g. ADM-2024-001" required autoCapitalize="characters" emoji="🆔" />
                            <Field label="Parent Name" value={parentName} onChangeText={setParentName} placeholder="e.g. Raj Kumar" emoji="👨‍👩‍👧" />
                            <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="e.g. 9876543210" keyboardType="phone-pad" autoCapitalize="none" emoji="📞" />
                        </View>

                        {/* Class (auto-assigned) */}
                        <View className="mb-4 rounded-2xl bg-slate-800 p-5">
                            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">School Details</Text>
                            <View className="mb-4">
                                <Text className="mb-2 text-sm font-semibold text-slate-400">📚 Class</Text>
                                <View className="flex-row items-center rounded-xl border border-slate-600 bg-slate-700 px-4 py-4">
                                    <Text className="mr-2">✅</Text>
                                    <Text className="flex-1 text-sm text-slate-400">Auto-assigned from your teacher profile</Text>
                                </View>
                            </View>
                            <Field label="Bus Route" value={busRoute} onChangeText={setBusRoute} placeholder="e.g. Route 3 - Sector 7" emoji="🚌" />
                            <Field label="Monthly Fee (₹)" value={monthlyFee} onChangeText={setMonthlyFee} placeholder="e.g. 1200" keyboardType="numeric" required autoCapitalize="none" emoji="💰" />
                        </View>

                        {/* Login Credentials */}
                        <View className="mb-6 rounded-2xl bg-slate-800 p-5">
                            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Login Credentials</Text>
                            <Field label="Email" value={email} onChangeText={setEmail} placeholder="student@school.com" keyboardType="email-address" required autoCapitalize="none" emoji="✉️" />
                            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" secureTextEntry required autoCapitalize="none" emoji="🔒" />
                        </View>

                        <Pressable
                            onPress={handleCreate}
                            disabled={loading}
                            className={`items-center rounded-xl py-4 ${loading ? "bg-purple-400" : "bg-purple-600"}`}
                        >
                            <Text className="font-bold text-white">
                                {loading ? "Registering..." : "✓ Register Student"}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}