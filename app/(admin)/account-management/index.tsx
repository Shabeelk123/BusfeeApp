import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors, Shadows } from "@/constants/colors";

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
            style={({ pressed }) => [
                {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    padding: 18,
                    marginBottom: 14,
                    opacity: pressed ? 0.85 : 1,
                },
                Shadows.card,
            ]}
        >
            <View
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                }}
            >
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.textPrimary }}>
                    {title}
                </Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
                    {subtitle}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.iconDefault} />
        </Pressable>
    );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function AccountManagementScreen() {
    return (
        <ScreenWrapper>
            <PageHeader
                title="Account Management"
                subtitle="Class and coordinator login accounts"
                showBack
            />

            <AccountTypeTile
                icon="people-outline"
                iconColor={Colors.primary}
                iconBg={Colors.primaryLight}
                title="Class Accounts"
                subtitle="One login per division — reset passwords, enable or disable access"
                onPress={() => router.push("/(admin)/class-accounts")}
            />

            <AccountTypeTile
                icon="analytics-outline"
                iconColor={Colors.info}
                iconBg={Colors.infoLight}
                title="Coordinator Accounts"
                subtitle="One coordinator per grade — create, reset, enable/disable or delete"
                onPress={() => router.push("/(admin)/coordinator-accounts")}
            />
        </ScreenWrapper>
    );
}
