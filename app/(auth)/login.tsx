import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import { useToast } from "@/components/common/ToastContext";
import { Radius } from "@/constants/colors";
import { useAppDispatch } from "@/hooks/redux";
import { navigateByRole } from "@/hooks/useSessionRestore";
import { supabase } from "@/lib/supabase";
import { loginUser } from "@/services/auth.service";
import { setUser } from "@/store/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches every dashboard) ────
const T = {
    background: "#f7fafc",
    surface: "#ffffff",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
    danger: "#e53e3e",
} as const;

type Role = "ADMIN" | "STUDENT" | "CLASS" | "COORDINATOR";

const ROLE_META: Record<
    Role,
    { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
    ADMIN: { label: "Administrator", icon: "shield-checkmark" },
    CLASS: { label: "Class Account", icon: "school-outline" },
    COORDINATOR: { label: "Coordinator", icon: "analytics-outline" },
    STUDENT: { label: "Student", icon: "school" },
};

export default function LoginScreen() {
    const dispatch = useAppDispatch();
    const toast = useToast();
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
                toast.error("Login Failed", error.message || "Invalid credentials");
                return;
            }

            const authUser = data.user;
            if (!authUser) {
                toast.error("Error", "User not found");
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
                toast.error(
                    "Profile Not Found",
                    `Auth succeeded but no users row found. ${detail}`,
                );
                await supabase.auth.signOut();
                return;
            }

            // ── Role validation ──────────────────────────────────────────
            // Ensure the credentials belong to the role the user selected.
            if (profile.role !== selectedRole) {
                // Sign out the Supabase session immediately — wrong portal.
                await supabase.auth.signOut();
                toast.error(
                    "Wrong Portal",
                    `These credentials belong to a ${profile.role.charAt(0) + profile.role.slice(1).toLowerCase()} account. Please go back and select the correct login portal.`,
                );
                return;
            }

            dispatch(setUser({ user: profile, role: profile.role }));
            navigateByRole(profile.role);
        } catch (err: any) {
            toast.error("Error", err?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [validateForm, email, password, dispatch, selectedRole, toast]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: T.background }}>
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
                        color={T.onSurfaceVariant}
                    />
                    <Text style={styles.backText}>Change role</Text>
                </Pressable>

                {/* ── Logo + Role badge ── */}
                <View style={styles.headerSection}>
                    <View style={styles.iconBadge}>
                        <Ionicons
                            name={meta.icon}
                            size={44}
                            color={T.navy}
                        />
                    </View>

                    {/* Role pill */}
                    <View style={styles.rolePill}>
                        <Ionicons
                            name={meta.icon}
                            size={12}
                            color={T.navy}
                        />
                        <Text style={styles.rolePillText}>
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
                    <AppInput
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        iconName="lock-closed-outline"
                        rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                        onRightIconPress={() => setShowPassword((v) => !v)}
                        required
                        error={errors.password}
                    />

                    {/* Submit */}
                    <AppButton
                        label={`Sign in as ${meta.label}`}
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        variant="navy"
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
        color: T.onSurfaceVariant,
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
        backgroundColor: T.navyLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    rolePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: T.navyLight,
        borderColor: T.navy + "40",
        marginBottom: 10,
    },
    rolePillText: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.3,
        color: T.navy,
    },
    heading: {
        fontSize: 26,
        fontWeight: "900",
        letterSpacing: -0.5,
        color: T.onSurface,
        marginBottom: 6,
        textAlign: "center",
    },
    subheading: {
        fontSize: 14,
        color: T.onSurfaceVariant,
        textAlign: "center",
        lineHeight: 22,
    },

    // Card
    card: {
        borderRadius: Radius.card,
        borderWidth: 1,
        borderColor: T.outline,
        backgroundColor: T.surface,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    // Footer
    footer: {
        textAlign: "center",
        fontSize: 12,
        color: T.onSurfaceVariant,
        lineHeight: 18,
    },
});
