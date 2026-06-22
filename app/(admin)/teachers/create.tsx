import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { Colors, Shadows } from "@/constants/colors";
import { createTeacher } from "@/services/teacher.service";
import { composeClassName } from "@/utils/className";

// ── Validation Utilities ────────────────────────────────────────────
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
    return password.length >= 6;
};

// ── Types ────────────────────────────────────────────────────────────
interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
}

// ── Section Card ─────────────────────────────────────────────────────
function SectionCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    children: React.ReactNode;
}) {
    return (
        <View style={{ marginBottom: 20 }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                }}
            >
                <View
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: Colors.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 8,
                    }}
                >
                    <Ionicons name={icon} size={15} color={Colors.primary} />
                </View>
                <Text
                    style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: Colors.textSecondary,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                    }}
                >
                    {title}
                </Text>
            </View>

            <View
                style={[
                    {
                        backgroundColor: Colors.card,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: Colors.cardBorderLight,
                    },
                    Shadows.card,
                ]}
            >
                {children}
            </View>
        </View>
    );
}

// ── Screen Component ────────────────────────────────────────────────
export default function CreateTeacherScreen() {
    const toast = useToast();

    // ── Form State ──────────────────────────────────────────
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [assignedClassLevel, setAssignedClassLevel] = useState("");
    const [assignedDivision, setAssignedDivision] = useState("");

    // ── UI State ────────────────────────────────────────────
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // ── Validation ──────────────────────────────────────────
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        if (!name.trim()) {
            newErrors.name = "Full name is required";
        }

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(email)) {
            newErrors.email = "Enter a valid email address";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (!validatePassword(password)) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [name, email, password]);

    // ── Submit Handler ──────────────────────────────────────
    const handleCreate = useCallback(async () => {
        if (!validateForm()) {
            toast.warning("Validation Error", "Please check all required fields");
            return;
        }

        try {
            setLoading(true);

            const { error } = await createTeacher({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                assigned_class: composeClassName(assignedClassLevel, assignedDivision),
            });

            if (error) {
                if (error.message?.includes("already exists")) {
                    setErrors({ email: "This email is already registered" });
                    toast.error("Registration Failed", "Email already exists");
                } else {
                    toast.error("Creation Failed", error.message || "Unable to create teacher profile");
                }
                return;
            }

            toast.success("Success", "Teacher account created successfully");
            setLoading(false);

            // Reset form
            setName("");
            setEmail("");
            setPassword("");
            setAssignedClassLevel("");
            setAssignedDivision("");
            setErrors({});
        } catch (error: any) {
            toast.error("Network Error", error?.message || "Failed to create teacher. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [validateForm, name, email, password, assignedClassLevel, assignedDivision, toast]);

    // ── Loading Overlay ─────────────────────────────────────
    if (loading) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 14 }}>
                        Creating teacher account...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={40}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}
            >
                <PageHeader
                    title="Add Teacher"
                    subtitle="Set up a new teacher account"
                    showBack
                />

                {/* ── Teacher Information ── */}
                <SectionCard title="Teacher Information" icon="person-outline">
                    <AppInput
                        label="Full Name"
                        required
                        iconName="person-outline"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Mrs. Anita Sharma"
                        autoCapitalize="words"
                        error={errors.name}
                        editable={!loading}
                    />
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="Assigned Class"
                                iconName="book-outline"
                                value={assignedClassLevel}
                                onChangeText={setAssignedClassLevel}
                                placeholder="e.g. 10"
                                autoCapitalize="characters"
                                editable={!loading}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="Division"
                                iconName="grid-outline"
                                value={assignedDivision}
                                onChangeText={setAssignedDivision}
                                placeholder="e.g. A"
                                autoCapitalize="characters"
                                editable={!loading}
                            />
                        </View>
                    </View>
                </SectionCard>

                {/* ── Login Credentials ── */}
                <SectionCard title="Login Credentials" icon="lock-closed-outline">
                    <AppInput
                        label="Email"
                        required
                        iconName="mail-outline"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="teacher@school.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                        editable={!loading}
                    />

                    {/* Password with toggle */}
                    <View style={{ marginBottom: 8 }}>
                        <Text
                            style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color: Colors.textPrimary,
                                marginBottom: 6,
                                marginLeft: 2,
                            }}
                        >
                            Password<Text style={{ color: Colors.danger }}> *</Text>
                        </Text>

                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: errors.password ? Colors.danger : Colors.inputBorder,
                                backgroundColor: errors.password ? Colors.dangerLight : Colors.inputBg,
                                paddingHorizontal: 14,
                                minHeight: 50,
                            }}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={18}
                                color={errors.password ? Colors.danger : Colors.iconDefault}
                                style={{ marginRight: 10 }}
                            />
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholder="Minimum 6 characters"
                                placeholderTextColor={Colors.textMuted}
                                editable={!loading}
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    color: Colors.textPrimary,
                                    paddingVertical: 12,
                                }}
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 8 })}
                                accessibilityRole="button"
                                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={18}
                                    color={Colors.iconDefault}
                                />
                            </Pressable>
                        </View>

                        {errors.password && (
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: Colors.danger,
                                    marginTop: 4,
                                    marginLeft: 2,
                                }}
                            >
                                {errors.password}
                            </Text>
                        )}
                    </View>
                </SectionCard>

                {/* ── Info Note ── */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        borderRadius: 12,
                        backgroundColor: Colors.primaryLight,
                        borderWidth: 1,
                        borderColor: Colors.primaryBorder,
                        padding: 14,
                        marginBottom: 24,
                    }}
                >
                    <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={Colors.primary}
                        style={{ marginRight: 10, marginTop: 1 }}
                    />
                    <Text style={{ flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 }}>
                        The teacher will log in with these credentials and manage students in their assigned class.
                    </Text>
                </View>

                {/* ── Create Button ── */}
                <AppButton
                    label="Create Teacher"
                    onPress={handleCreate}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    iconLeft="person-add-outline"
                />
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}
