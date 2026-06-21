import { useState } from "react";

import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";

import { router as expoRouter } from "expo-router";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { createStudent } from "../../../services/student.service";

interface FieldProps {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: any;
    secureTextEntry?: boolean;
    required?: boolean;
    autoCapitalize?: any;
    emoji?: string;
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    secureTextEntry,
    required,
    autoCapitalize,
    emoji,
}: FieldProps) {
    return (
        <View className="mb-5">
            <Text className="mb-2 ml-1 text-sm font-semibold text-gray-700">
                {emoji} {label}
                {required && (
                    <Text className="text-red-500">
                        {" "}*
                    </Text>
                )}
            </Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize={
                    autoCapitalize ??
                    "words"
                }
                className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-base text-gray-900"
            />
        </View>
    );
}

export default function CreateStudentScreen() {
    const toast = useToast();
    const [fullName, setFullName] =
        useState("");

    const [
        admissionNo,
        setAdmissionNo,
    ] = useState("");

    const [parentName, setParentName] =
        useState("");

    const [phone, setPhone] =
        useState("");

    const [className, setClassName] =
        useState("");

    const [busRoute, setBusRoute] =
        useState("");

    const [monthlyFee, setMonthlyFee] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleCreate =
        async () => {
            if (
                !fullName ||
                !admissionNo ||
                !monthlyFee ||
                !email ||
                !password
            ) {
                toast.warning(
                    "Missing Fields",
                    "Please fill in all required fields."
                );

                return;
            }

            try {
                setLoading(true);

                const { error } =
                    await createStudent({
                        full_name:
                            fullName,

                        admission_no:
                            admissionNo,

                        parent_name:
                            parentName,

                        phone,

                        class_name:
                            className,

                        bus_route:
                            busRoute,

                        email,

                        password,

                        monthly_fee:
                            Number(
                                monthlyFee
                            ),
                    });

                if (error) {
                    toast.error(
                        "Create Failed",
                        error.message
                    );

                    return;
                }

                toast.success(
                    "Student Added",
                    "Student profile created successfully."
                );

                expoRouter.back();
            } catch (error) {
                toast.error(
                    "Network Error",
                    "Failed to create student."
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <ScreenWrapper>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: 40,
                }}
            >
                <KeyboardAwareScrollView
                    enableOnAndroid
                    extraScrollHeight={30}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingTop: 20,
                        paddingBottom: 40,
                    }}
                >
                    {/* Header */}
                    <Pressable
                        onPress={() =>
                            expoRouter.back()
                        }
                        className="mb-6 self-start rounded-full bg-white px-4 py-2 shadow-sm"
                    >
                        <Text className="font-semibold text-blue-600">
                            ← Back
                        </Text>
                    </Pressable>

                    <View className="mb-8">
                        <Text className="text-3xl font-black tracking-tight text-gray-900">
                            Add Student
                        </Text>

                        <Text className="mt-2 text-base leading-6 text-gray-500">
                            Create a new student
                            profile and login
                            credentials
                        </Text>
                    </View>

                    {/* Personal Info */}
                    <View className="mb-5 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                        <Text className="mb-5 text-xs font-bold uppercase tracking-[2px] text-gray-400">
                            Personal Information
                        </Text>

                        <Field
                            label="Full Name"
                            value={fullName}
                            onChangeText={
                                setFullName
                            }
                            placeholder="e.g. Rahul Kumar"
                            required
                        />

                        <Field
                            label="Admission Number"
                            value={admissionNo}
                            onChangeText={
                                setAdmissionNo
                            }
                            placeholder="e.g. ADM-2026-001"
                            required
                            autoCapitalize="characters"
                        />

                        <Field
                            label="Parent Name"
                            value={parentName}
                            onChangeText={
                                setParentName
                            }
                            placeholder="e.g. Raj Kumar"
                        />

                        <Field
                            label="Phone Number"
                            value={phone}
                            onChangeText={
                                setPhone
                            }
                            placeholder="e.g. 9876543210"
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* School Details */}
                    <View className="mb-5 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                        <Text className="mb-5 text-xs font-bold uppercase tracking-[2px] text-gray-400">
                            School Details
                        </Text>

                        <Field
                            label="Class"
                            value={className}
                            onChangeText={
                                setClassName
                            }
                            placeholder="e.g. 10-A"
                        />

                        <Field
                            label="Bus Route"
                            value={busRoute}
                            onChangeText={
                                setBusRoute
                            }
                            placeholder="e.g. Route 3"
                        />

                        <Field
                            label="Monthly Fee (₹)"
                            value={monthlyFee}
                            onChangeText={
                                setMonthlyFee
                            }
                            placeholder="e.g. 1200"
                            keyboardType="numeric"
                            required
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Login Credentials */}
                    <View className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                        <Text className="mb-5 text-xs font-bold uppercase tracking-[2px] text-gray-400">
                            Login Credentials
                        </Text>

                        <Field
                            label="Email"
                            value={email}
                            onChangeText={
                                setEmail
                            }
                            placeholder="student@school.com"
                            keyboardType="email-address"
                            required
                            autoCapitalize="none"
                        />

                        <Field
                            label="Password"
                            value={password}
                            onChangeText={
                                setPassword
                            }
                            placeholder="Minimum 6 characters"
                            secureTextEntry
                            required
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={
                            handleCreate
                        }
                        disabled={loading}
                        className={`mt-8 h-14 items-center justify-center rounded-2xl ${loading
                            ? "bg-blue-400"
                            : "bg-blue-600"
                            }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-base font-bold tracking-wide text-white">
                                Create Student
                            </Text>
                        )}
                    </Pressable>
                </KeyboardAwareScrollView>
            </ScrollView>
        </ScreenWrapper>
    );
}