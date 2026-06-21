import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { Colors } from "../../constants/colors";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props {
    label: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    iconLeft?: keyof typeof Ionicons.glyphMap;
    iconRight?: keyof typeof Ionicons.glyphMap;
    fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary:   { bg: Colors.primary,   text: Colors.textOnDark },
    secondary: { bg: Colors.card,      text: Colors.textPrimary, border: Colors.cardBorder },
    danger:    { bg: Colors.danger,    text: Colors.textOnDark },
    ghost:     { bg: "transparent",    text: Colors.primary },
};

const SIZE_STYLES: Record<Size, { py: number; px: number; text: number; icon: number; radius: number }> = {
    sm: { py: 8,  px: 14, text: 13, icon: 14, radius: 10 },
    md: { py: 12, px: 20, text: 15, icon: 16, radius: 12 },
    lg: { py: 14, px: 24, text: 16, icon: 18, radius: 14 },
};

export default function AppButton({
    label,
    onPress,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    iconLeft,
    iconRight,
    fullWidth = false,
}: Props) {
    const v = VARIANT_STYLES[variant];
    const s = SIZE_STYLES[size];
    const isDisabled = disabled || loading;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: v.bg,
                paddingVertical: s.py,
                paddingHorizontal: s.px,
                borderRadius: s.radius,
                borderWidth: v.border ? 1.5 : 0,
                borderColor: v.border,
                opacity: pressed || isDisabled ? 0.65 : 1,
                alignSelf: fullWidth ? "stretch" : "auto",
                minHeight: 44, // accessibility minimum
            })}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === "secondary" || variant === "ghost" ? Colors.primary : Colors.textOnDark}
                    size="small"
                />
            ) : (
                <>
                    {iconLeft && (
                        <Ionicons
                            name={iconLeft}
                            size={s.icon}
                            color={v.text}
                            style={{ marginRight: 6 }}
                        />
                    )}
                    <Text style={{ fontSize: s.text, fontWeight: "700", color: v.text }}>
                        {label}
                    </Text>
                    {iconRight && (
                        <Ionicons
                            name={iconRight}
                            size={s.icon}
                            color={v.text}
                            style={{ marginLeft: 6 }}
                        />
                    )}
                </>
            )}
        </Pressable>
    );
}
