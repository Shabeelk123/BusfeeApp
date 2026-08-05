import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Colors, Shadows } from "../../constants/colors";
import AccountStatusChip from "./AccountStatusChip";

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
            style={[
                {
                    backgroundColor: Colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    padding: 16,
                    marginBottom: 12,
                },
                Shadows.card,
            ]}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: Colors.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                    }}
                >
                    <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.primary }}>
                        {badgeLabel}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: Colors.textPrimary }}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 1 }}>
                            {subtitle}
                        </Text>
                    ) : null}
                    <Text numberOfLines={1} style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
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
                        backgroundColor: Colors.inputBg,
                        borderWidth: 1,
                        borderColor: Colors.inputBorder,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Ionicons name="key-outline" size={15} color={Colors.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textSecondary }}>
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
                        backgroundColor: enabled ? Colors.dangerLight : Colors.successLight,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Ionicons
                        name={enabled ? "lock-closed-outline" : "lock-open-outline"}
                        size={15}
                        color={enabled ? Colors.danger : Colors.success}
                    />
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: enabled ? Colors.danger : Colors.success,
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
                            backgroundColor: Colors.dangerLight,
                            opacity: pressed ? 0.7 : 1,
                        })}
                    >
                        <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    </Pressable>
                )}
            </View>
        </View>
    );
}
