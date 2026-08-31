import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import PasswordField from "./PasswordField";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    visible: boolean;
    /** Name shown in the title, e.g. "8A" or "Grade 8 Coordinator" */
    accountLabel: string;
    /** Called with the chosen password. Return an error to keep the dialog open. */
    onConfirm: (newPassword: string) => Promise<{ error?: any } | void>;
    onCancel: () => void;
}

interface FieldErrors {
    password?: string;
    confirmPassword?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
// Shared by Class Accounts and Coordinator Accounts — both just pass a
// different accountLabel and onConfirm handler.

export default function ResetPasswordDialog({
    visible,
    accountLabel,
    onConfirm,
    onCancel,
}: Props) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [busy, setBusy] = useState(false);

    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, { damping: 18, stiffness: 260 });
            opacity.value = withTiming(1, { duration: 180 });
        } else {
            scale.value = withTiming(0.85, { duration: 160 });
            opacity.value = withTiming(0, { duration: 160 });
            setPassword("");
            setConfirmPassword("");
            setShowPassword(false);
            setErrors({});
            setBusy(false);
        }
    }, [visible]);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const validate = (): boolean => {
        const newErrors: FieldErrors = {};

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Must be at least 8 characters";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Confirm your password";
        } else if (password && confirmPassword !== password) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = async () => {
        if (!validate()) return;

        try {
            setBusy(true);
            const result = await onConfirm(password);
            if (result?.error) {
                setErrors({ password: result.error.message || "Failed to reset password" });
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <Pressable
                onPress={onCancel}
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                }}
            >
                <Animated.View
                    style={[
                        cardStyle,
                        {
                            width: "100%",
                            maxWidth: 380,
                            backgroundColor: "#FFFFFF",
                            borderRadius: 28,
                            padding: 28,
                            shadowColor: "#000",
                            shadowOpacity: 0.18,
                            shadowRadius: 24,
                            shadowOffset: { width: 0, height: 8 },
                            elevation: 12,
                        },
                    ]}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        {/* Icon circle */}
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 20,
                                backgroundColor: T.navyLight,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 20,
                            }}
                        >
                            <Ionicons name="key-outline" size={32} color={T.navy} />
                        </View>

                        {/* Title */}
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: "800",
                                color: "#111827",
                                marginBottom: 8,
                            }}
                        >
                            Reset password for {accountLabel}?
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                lineHeight: 22,
                                color: "#6B7280",
                                marginBottom: 20,
                            }}
                        >
                            Enter a new password for this account. It takes effect immediately.
                        </Text>

                        <PasswordField
                            label="New Password"
                            required
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Min. 8 characters"
                            error={errors.password}
                            editable={!busy}
                            visible={showPassword}
                            onToggleVisible={() => setShowPassword((v) => !v)}
                        />

                        <View style={{ marginBottom: 10 }}>
                            <PasswordField
                                label="Confirm Password"
                                required
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Re-enter password"
                                error={errors.confirmPassword}
                                editable={!busy}
                                visible={showPassword}
                            />
                        </View>

                        {/* Divider */}
                        <View style={{ height: 1, backgroundColor: "#F3F4F6", marginBottom: 20, marginTop: 10 }} />

                        {/* Buttons */}
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <Pressable
                                onPress={onCancel}
                                disabled={busy}
                                style={({ pressed }) => ({
                                    flex: 1,
                                    height: 48,
                                    borderRadius: 14,
                                    borderWidth: 1.5,
                                    borderColor: "#E5E7EB",
                                    backgroundColor: pressed ? "#F9FAFB" : "#FFFFFF",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: busy ? 0.5 : 1,
                                })}
                            >
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>Cancel</Text>
                            </Pressable>

                            <Pressable
                                onPress={handleConfirm}
                                disabled={busy}
                                style={({ pressed }) => ({
                                    flex: 1,
                                    height: 48,
                                    borderRadius: 14,
                                    backgroundColor: T.navy,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: pressed || busy ? 0.8 : 1,
                                })}
                            >
                                {busy ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                                        Reset Password
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}
