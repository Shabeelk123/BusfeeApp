import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import AccountStatusChip from "./AccountStatusChip";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    muted: "#8a8d93",
    outline: "#e2e8f0",
    inputBg: "#f7fafc",
    success: "#2d7a4d",
    successLight: "#e3f3e9",
    danger: "#e53e3e",
    dangerLight: "#fdeaea",
} as const;

interface Props {
    /** Short badge text, e.g. "8A" for a class account or "C8" for a coordinator */
    badgeLabel: string;
    /** Primary heading, e.g. "Grade 8 · Division A" or a coordinator's name */
    title: string;
    /** Secondary line under the title. Omit if not needed. */
    subtitle?: string;
    loginId: string;
    enabled: boolean;
    onReset: () => void;
    onToggle: () => void;
    /** Renders a Delete icon button when provided */
    onDelete?: () => void;
}

export default function AccountCard({
    badgeLabel,
    title,
    subtitle,
    loginId,
    enabled,
    onReset,
    onToggle,
    onDelete,
}: Props) {
    return (
        <View
            style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: T.outline,
                padding: 16,
                marginBottom: 12,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: T.navyLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                    }}
                >
                    <Text style={{ fontSize: 14, fontWeight: "800", color: T.navy }}>
                        {badgeLabel}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text numberOfLines={1} style={{ fontSize: 13, color: T.onSurfaceVariant, marginTop: 1 }}>
                            {subtitle}
                        </Text>
                    ) : null}
                    <Text numberOfLines={1} style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                        {loginId}
                    </Text>
                </View>
                <AccountStatusChip enabled={enabled} />
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                    onPress={onReset}
                    style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: T.inputBg,
                        borderWidth: 1,
                        borderColor: T.outline,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Ionicons name="key-outline" size={15} color={T.onSurfaceVariant} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: T.onSurfaceVariant }}>
                        Reset Password
                    </Text>
                </Pressable>

                <Pressable
                    onPress={onToggle}
                    style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: enabled ? T.dangerLight : T.successLight,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Ionicons
                        name={enabled ? "lock-closed-outline" : "lock-open-outline"}
                        size={15}
                        color={enabled ? T.danger : T.success}
                    />
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: enabled ? T.danger : T.success,
                        }}
                    >
                        {enabled ? "Disable" : "Enable"}
                    </Text>
                </Pressable>

                {onDelete && (
                    <Pressable
                        onPress={onDelete}
                        accessibilityRole="button"
                        accessibilityLabel="Delete account"
                        style={({ pressed }) => ({
                            width: 40,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 10,
                            backgroundColor: T.dangerLight,
                            opacity: pressed ? 0.7 : 1,
                        })}
                    >
                        <Ionicons name="trash-outline" size={16} color={T.danger} />
                    </Pressable>
                )}
            </View>
        </View>
    );
}
