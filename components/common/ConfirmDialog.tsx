import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    Text,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DialogVariant = "danger" | "warning" | "info";

interface Props {
    /** Whether the dialog is visible */
    visible: boolean;
    /** Title shown in bold at the top of the card */
    title: string;
    /** Body copy beneath the title */
    subtitle?: string;
    /** Visual style — affects icon and confirm button colour */
    variant?: DialogVariant;
    /** Label for the confirm (right) button. Default: "Confirm" */
    confirmLabel?: string;
    /** Label for the cancel (left) button. Default: "Cancel" */
    cancelLabel?: string;
    /** Called when the user taps the confirm button.
     *  If it returns a Promise the confirm button shows a spinner until it resolves. */
    onConfirm: () => void | Promise<void>;
    /** Called when the user taps cancel or the backdrop */
    onCancel: () => void;
}

// ─── Variant meta ─────────────────────────────────────────────────────────────

const VARIANTS: Record<
    DialogVariant,
    {
        iconBg: string;
        iconColor: string;
        icon: keyof typeof Ionicons.glyphMap;
        confirmBg: string;
        confirmText: string;
    }
> = {
    danger: {
        iconBg: "#FEE2E2",
        iconColor: "#DC2626",
        icon: "trash-outline",
        confirmBg: "#DC2626",
        confirmText: "#FFFFFF",
    },
    warning: {
        iconBg: "#FEF3C7",
        iconColor: "#D97706",
        icon: "warning-outline",
        confirmBg: "#D97706",
        confirmText: "#FFFFFF",
    },
    info: {
        iconBg: "#DBEAFE",
        iconColor: "#2563EB",
        icon: "information-circle-outline",
        confirmBg: "#2563EB",
        confirmText: "#FFFFFF",
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfirmDialog({
    visible,
    title,
    subtitle,
    variant = "danger",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}: Props) {
    const meta = VARIANTS[variant];
    const [busy, setBusy] = useState(false);

    // Sheet animation
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, { damping: 18, stiffness: 260 });
            opacity.value = withTiming(1, { duration: 180 });
        } else {
            scale.value = withTiming(0.85, { duration: 160 });
            opacity.value = withTiming(0, { duration: 160 });
            setBusy(false);
        }
    }, [visible]);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handleConfirm = async () => {
        const result = onConfirm();
        if (result instanceof Promise) {
            setBusy(true);
            try {
                await result;
            } finally {
                setBusy(false);
            }
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
            {/* Backdrop */}
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
                {/* Card — stopPropagation so tapping the card doesn't close */}
                <Animated.View
                    style={[
                        cardStyle,
                        {
                            width: "100%",
                            maxWidth: 360,
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
                                backgroundColor: meta.iconBg,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 20,
                            }}
                        >
                            <Ionicons name={meta.icon} size={32} color={meta.iconColor} />
                        </View>

                        {/* Title */}
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: "800",
                                color: "#111827",
                                marginBottom: subtitle ? 8 : 24,
                            }}
                        >
                            {title}
                        </Text>

                        {/* Subtitle */}
                        {subtitle ? (
                            <Text
                                style={{
                                    fontSize: 14,
                                    lineHeight: 22,
                                    color: "#6B7280",
                                    marginBottom: 28,
                                }}
                            >
                                {subtitle}
                            </Text>
                        ) : null}

                        {/* Divider */}
                        <View
                            style={{
                                height: 1,
                                backgroundColor: "#F3F4F6",
                                marginBottom: 20,
                            }}
                        />

                        {/* Buttons */}
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            {/* Cancel */}
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
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: "600",
                                        color: "#374151",
                                    }}
                                >
                                    {cancelLabel}
                                </Text>
                            </Pressable>

                            {/* Confirm */}
                            <Pressable
                                onPress={handleConfirm}
                                disabled={busy}
                                style={({ pressed }) => ({
                                    flex: 1,
                                    height: 48,
                                    borderRadius: 14,
                                    backgroundColor: meta.confirmBg,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: pressed || busy ? 0.8 : 1,
                                })}
                            >
                                {busy ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            color: meta.confirmText,
                                        }}
                                    >
                                        {confirmLabel}
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
