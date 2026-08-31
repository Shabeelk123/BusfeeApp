import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background: "#f7fafc",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    accentDeep: "#7c5800",
    accentLight: "#fdf3e0",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
} as const;

// ── Nav Tile ──────────────────────────────────────────────────────────────────
function AccountTypeTile({
    icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: T.outline,
                padding: 16,
                marginBottom: 12,
                opacity: pressed ? 0.85 : 1,
            })}
        >
            <View
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 13,
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                }}
            >
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>
                    {title}
                </Text>
                <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 2 }}>
                    {subtitle}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.onSurfaceVariant} />
        </Pressable>
    );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function AccountManagementScreen() {
    return (
        <ScreenWrapper backgroundColor={T.background}>
            <PageHeader
                title="Account Management"
                subtitle="Class & coordinator logins"
                showBack
            />

            <AccountTypeTile
                icon="people-outline"
                iconColor={T.navy}
                iconBg={T.navyLight}
                title="Class Accounts"
                subtitle="Reset passwords, turn access on or off"
                onPress={() => router.push("/(admin)/class-accounts")}
            />

            <AccountTypeTile
                icon="analytics-outline"
                iconColor={T.accentDeep}
                iconBg={T.accentLight}
                title="Coordinator Accounts"
                subtitle="Add, reset or remove grade coordinators"
                onPress={() => router.push("/(admin)/coordinator-accounts")}
            />
        </ScreenWrapper>
    );
}
