import AppButton from "@/components/common/AppButton";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { getCurrentUserProfile } from "../../../services/auth.service";
import { createStudent } from "../../../services/student.service";

interface FieldProps {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: any;
    secureTextEntry?: boolean;
    autoCapitalize?: any;
    required?: boolean;
    iconName: keyof typeof Ionicons.glyphMap;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, required, iconName }: FieldProps) {
    return (
        <View className="mb-5">
            <Text className="mb-2 ml-1 text-sm font-semibold text-gray-700">
                {label}
                {required && <Text className="text-red-500"> *</Text>}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                <Ionicons name={iconName} size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize={autoCapitalize ?? "words"}
                    className="flex-1 py-4 text-base text-gray-900"
                />
            </View>
        </View>
    );
}

export default function TeacherCreateStudentScreen() {
    const toast = useToast();
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
            toast.warning("Missing Fields", "Please fill in all required fields.");
            return;
        }
        try {
            setLoading(true);
            const profile = await getCurrentUserProfile();
            if (!profile) {
                toast.error("Session Error", "Teacher profile not found. Please log in again.");
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
            if (error) {
                toast.error("Create Failed", error.message);
                return;
            }
            toast.success("Student Added", "Student registered successfully.");
            router.back();
        } catch (error) {
            toast.error("Network Error", "Failed to create student. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={30}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}
            >
                <PageHeader
                    title="Add Student"
                    subtitle="Create a new student profile for your class"
                    showBack
                />

                {/* Personal Info */}
                <View
                    className="mb-5 rounded-[28px] border border-gray-100 bg-white p-6"
                    style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
                >
                    <Text className="mb-5 text-xs font-bold uppercase tracking-[2px] text-gray-400">
                        Personal Information
                    </Text>
                    <Field iconName="person-outline" label="Full Name" value={fullName} onChangeText={setFullName} placeholder="e.g. Rahul Kumar" required />
                    <Field iconName="id-card-outline" label="Admission Number" value={admissionNo} onChangeText={setAdmissionNo} placeholder="e.g. ADM-2026-001" required autoCapitalize="characters" />
                    <Field iconName="people-outline" label="Parent Name" value={parentName} onChangeText={setParentName} placeholder="e.g. Raj Kumar" />
                    <Field iconName="call-outline" label="Phone Number" value={phone} onChangeText={setPhone} placeholder="e.g. 9876543210" keyboardType="phone-pad" autoCapitalize="none" />
                </View>

                {/* School Details */}
                <View
                    className="mb-5 rounded-[28px] border border-gray-100 bg-white p-6"
                    style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
                >
                    <Text className="mb-5 text-xs font-bold uppercase tracking-[2px] text-gray-400">
                        School Details
                    </Text>

                    {/* Class auto-assigned */}
                    <View className="mb-5">
                        <Text className="mb-2 ml-1 text-sm font-semibold text-gray-700">Class</Text>
                        <View className="flex-row items-center rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                            <Ionicons name="checkmark-circle" size={18} color="#2563eb" style={{ marginRight: 10 }} />
                            <Text className="flex-1 text-sm text-blue-600">Auto-assigned from your teacher profile</Text>
                        </View>
                    </View>

                    <Field iconName="bus-outline" label="Bus Route" value={busRoute} onChangeText={setBusRoute} placeholder="e.g. Route 3 - Sector 7" />
                    <Field iconName="cash-outline" label="Monthly Fee (₹)" value={monthlyFee} onChangeText={setMonthlyFee} placeholder="e.g. 1200" keyboardType="numeric" required autoCapitalize="none" />
                </View>

                {/* Login Credentials */}
                <View
                    className="rounded-[28px] border border-gray-100 bg-white p-6"
                    style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
                >
                    <Text className="mb-5 text-xs font-bold uppercase tracking-[2px] text-gray-400">
                        Login Credentials
                    </Text>
                    <Field iconName="mail-outline" label="Email" value={email} onChangeText={setEmail} placeholder="student@school.com" keyboardType="email-address" required autoCapitalize="none" />
                    <Field iconName="lock-closed-outline" label="Password" value={password} onChangeText={setPassword} placeholder="Minimum 6 characters" secureTextEntry required autoCapitalize="none" />
                </View>

                {/* Submit */}
                <Pressable
                    onPress={handleCreate}
                    disabled={loading}
                    style={({ pressed }) => ({ opacity: pressed || loading ? 0.8 : 1 })}
                    className={`mt-8 h-14 flex-row items-center justify-center rounded-2xl ${loading ? "bg-blue-400" : "bg-blue-600"}`}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="person-add-outline" size={18} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-base font-bold tracking-wide text-white">Register Student</Text>
                        </>
                    )}
                </Pressable>
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}