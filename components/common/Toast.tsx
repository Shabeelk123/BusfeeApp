import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastConfig {
    id: string;
    type: ToastType;
    title: string;
    subtitle?: string;
    duration?: number; // ms, default 3500
}

interface Props extends ToastConfig {
    onDismiss: (id: string) => void;
}

const VARIANTS: Record<
    ToastType,
    { bg: string; iconBg: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; titleColor: string }
> = {
    success: {
        bg: "#F0FDF4",
        iconBg: "#DCFCE7",
        icon: "checkmark-circle",
        iconColor: "#16A34A",
        titleColor: "#14532D",
    },
    error: {
        bg: "#FEF2F2",
        iconBg: "#FEE2E2",
        icon: "close-circle",
        iconColor: "#DC2626",
        titleColor: "#7F1D1D",
    },
    warning: {
        bg: "#FFFBEB",
        iconBg: "#FEF3C7",
        icon: "warning",
        iconColor: "#D97706",
        titleColor: "#78350F",
    },
    info: {
        bg: "#EFF6FF",
        iconBg: "#DBEAFE",
        icon: "information-circle",
        iconColor: "#2563EB",
        titleColor: "#1E3A5F",
    },
};

export default function Toast({ id, type, title, subtitle, duration = 3500, onDismiss }: Props) {
    const insets = useSafeAreaInsets();
    const variant = VARIANTS[type];

    // Slide in from top + fade
    const translateY = useSharedValue(-120);
    const opacity = useSharedValue(0);

    const dismiss = () => onDismiss(id);

    useEffect(() => {
        // Enter
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
        opacity.value = withTiming(1, { duration: 220 });

        // Auto-dismiss
        const timer = setTimeout(() => {
            opacity.value = withTiming(0, { duration: 250 });
            translateY.value = withTiming(-120, { duration: 280 }, (finished) => {
                if (finished) runOnJS(dismiss)();
            });
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                animStyle,
                {
                    marginTop: insets.top + 8,
                    marginHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor: variant.bg,
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: variant.iconBg,
                },
            ]}
        >
            <Pressable
                onPress={dismiss}
                style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}
            >
                {/* Icon */}
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: variant.iconBg,
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Ionicons name={variant.icon} size={22} color={variant.iconColor} />
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 14, color: variant.titleColor }} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }} numberOfLines={2}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                {/* Dismiss X */}
                <Ionicons name="close" size={16} color="#9CA3AF" />
            </Pressable>
        </Animated.View>
    );
}
