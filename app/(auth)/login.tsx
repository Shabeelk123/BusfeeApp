import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import { Colors, Radius, Shadows } from "@/constants/colors";
import { useAppDispatch } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { loginUser } from "@/services/auth.service";
import { setUser } from "@/store/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";


type Role = "ADMIN" | "STUDENT" | "CLASS" | "COORDINATOR";

const ROLE_META: Record<
    Role,
    { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; colorLight: string }
> = {
    ADMIN: {
        label: "Administrator",
        icon: "shield-checkmark",
        color: Colors.primary,
        colorLight: "#EFF6FF",
    },
    CLASS: {
        label: "Class Account",
        icon: "school-outline",
        color: "#0891B2",
        colorLight: "#E0F2FE",
    },
    COORDINATOR: {
        label: "Coordinator",
        icon: "analytics-outline",
        color: "#7C3AED",
        colorLight: "#EDE9FE",
    },
    STUDENT: {
        label: "Student",
        icon: "school",
        color: "#D97706",
        colorLight: "#FEF3C7",
    },
};

export default function LoginScreen() {
    const dispatch = useAppDispatch();
    const { role } = useLocalSearchParams<{ role?: Role }>();

    // Fall back gracefully if accessed directly without a role param
    const selectedRole: Role = role ?? "ADMIN";
    const meta = ROLE_META[selectedRole];

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validateForm = useCallback((): boolean => {
        const newErrors: typeof errors = {};

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Enter a valid email address";
        }

        if (!password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [email, password]);

    const handleLogin = useCallback(async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const { data, error } = await loginUser(
                email.trim().toLowerCase(),
                password,
            );

            if (error) {
                Alert.alert("Login Failed", error.message || "Invalid credentials");
                return;
            }

            const authUser = data.user;
            if (!authUser) {
                Alert.alert("Error", "User not found");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", authUser.id)   // V2: users.id = auth.uid()
                .single();

            if (profileError || !profile) {
                console.error("[Login] Profile fetch failed:", profileError);
                const detail = profileError?.message ?? "No profile row found in users table";
                Alert.alert(
                    "Profile Not Found",
                    `Auth succeeded but no users row found.\n\nDetail: ${detail}\n\nAuth UID: ${authUser.id}`
                );
                await supabase.auth.signOut();
                return;
            }

            // ── Role validation ──────────────────────────────────────────
            // Ensure the credentials belong to the role the user selected.
            if (profile.role !== selectedRole) {
                // Sign out the Supabase session immediately — wrong portal.
                await supabase.auth.signOut();
                Alert.alert(
                    "Wrong Portal",
                    `These credentials belong to a ${profile.role.charAt(0) + profile.role.slice(1).toLowerCase()} account. Please go back and select the correct login portal.`,
                );
                return;
            }

            dispatch(setUser({ user: profile, role: profile.role }));

            if (profile.role === "ADMIN") router.replace("/(admin)/dashboard");
            else if (profile.role === "CLASS") router.replace("/(class)/dashboard");
            // COORDINATOR — temporary: routes to the teacher dashboard placeholder
            // until the Coordinator module is built.
            else if (profile.role === "COORDINATOR") router.replace("/(teacher)/dashboard");
            else if (profile.role === "STUDENT") router.replace("/(student)/dashboard");
        } catch (err: any) {
            Alert.alert("Error", err?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [validateForm, email, password, dispatch, selectedRole]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={40}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* ── Back button ── */}
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <Ionicons
                        name="arrow-back"
                        size={20}
                        color={Colors.textSecondary}
                    />
                    <Text style={styles.backText}>Change role</Text>
                </Pressable>

                {/* ── Logo + Role badge ── */}
                <View style={styles.headerSection}>
                    <View
                        style={[
                            styles.iconBadge,
                            { backgroundColor: meta.colorLight },
                        ]}
                    >
                        <Ionicons
                            name={meta.icon}
                            size={44}
                            color={meta.color}
                        />
                    </View>

                    {/* Role pill */}
                    <View
                        style={[
                            styles.rolePill,
                            {
                                backgroundColor: meta.colorLight,
                                borderColor: meta.color + "40",
                            },
                        ]}
                    >
                        <Ionicons
                            name={meta.icon}
                            size={12}
                            color={meta.color}
                        />
                        <Text style={[styles.rolePillText, { color: meta.color }]}>
                            {meta.label} Login
                        </Text>
                    </View>

                    <Text style={styles.heading}>Welcome Back</Text>
                    <Text style={styles.subheading}>
                        Sign in to your {meta.label.toLowerCase()} dashboard
                    </Text>
                </View>

                {/* ── Login Card ── */}
                <View style={styles.card}>
                    {/* Email */}
                    <AppInput
                        label="Email Address"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        iconName="mail-outline"
                        required
                        error={errors.email}
                    />

                    {/* Password */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={styles.fieldLabel}>
                            Password
                            <Text style={{ color: Colors.danger }}> *</Text>
                        </Text>

                        <View
                            style={[
                                styles.passwordRow,
                                {
                                    borderColor: errors.password
                                        ? Colors.danger
                                        : Colors.inputBorder,
                                    backgroundColor: errors.password
                                        ? "#FEE2E2"
                                        : Colors.inputBg,
                                },
                            ]}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={18}
                                color={
                                    errors.password
                                        ? Colors.danger
                                        : Colors.iconDefault
                                }
                                style={{ marginRight: 10 }}
                            />
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.textMuted}
                                style={styles.passwordInput}
                            />
                            <AppButton
                                label={showPassword ? "Hide" : "Show"}
                                onPress={() => setShowPassword(!showPassword)}
                                variant="ghost"
                                size="sm"
                                iconRight={
                                    showPassword ? "eye-off-outline" : "eye-outline"
                                }
                            />
                        </View>
                        {errors.password && (
                            <Text style={styles.fieldError}>{errors.password}</Text>
                        )}
                    </View>

                    {/* Submit */}
                    <AppButton
                        label={`Sign in as ${meta.label}`}
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        fullWidth
                    />
                </View>

                {/* ── Footer ── */}
                <View style={{ alignItems: "center" }}>
                    <Text style={styles.footer}>
                        School ERP Management System © 2026
                    </Text>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
    },

    // Back
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingVertical: 6,
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    backText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: "500",
    },

    // Header
    headerSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    iconBadge: {
        width: 72,
        height: 72,
        borderRadius: Radius.hero,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        ...Shadows.cardMd,
    },
    rolePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        marginBottom: 10,
    },
    rolePillText: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    heading: {
        fontSize: 26,
        fontWeight: "900",
        letterSpacing: -0.5,
        color: Colors.textPrimary,
        marginBottom: 6,
        textAlign: "center",
    },
    subheading: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
    },

    // Card
    card: {
        borderRadius: Radius.card,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        backgroundColor: Colors.card,
        padding: 20,
        marginBottom: 16,
        ...Shadows.card,
    },

    // Fields
    fieldLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 6,
        marginLeft: 2,
    },
    passwordRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: Radius.input,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        minHeight: 50,
    },
    passwordInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
        paddingVertical: 12,
    },
    fieldError: {
        fontSize: 12,
        color: Colors.danger,
        marginTop: 4,
        marginLeft: 2,
    },

    // Footer
    footer: {
        textAlign: "center",
        fontSize: 12,
        color: Colors.textMuted,
        lineHeight: 18,
    },
});
