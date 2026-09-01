import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { clearUser } from "@/store/authSlice";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background: "#f7fafc",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
    danger: "#e53e3e",
    dangerLight: "#fdeaea",
} as const;

interface MenuItem {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sublabel: string;
    onPress: () => void;
    variant?: "default" | "danger";
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
    const isDanger = item.variant === "danger";
    return (
        <Pressable
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 14,
                backgroundColor: pressed ? (isDanger ? T.dangerLight : "#f1f4f6") : "transparent",
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: T.outline,
            })}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: isDanger ? T.dangerLight : T.navyLight,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={item.icon} size={20} color={isDanger ? T.danger : T.navy} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: isDanger ? T.danger : T.onSurface }}>
                    {item.label}
                </Text>
                <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 1 }}>
                    {item.sublabel}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDanger ? T.danger : T.onSurfaceVariant} />
        </Pressable>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
// Replaces the hamburger drawer for the Class account — same "Menu" tab
// pattern as Admin (see app/(admin)/(tabs)/menu.tsx), so the whole app is
// reachable through the tab bar alone instead of mixing tabs with a
// separate drawer gesture.
export default function ClassMenuScreen() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(clearUser());
        router.replace("/(auth)/role-select");
    };

    const items: MenuItem[] = [
        {
            id: "about",
            icon: "information-circle-outline",
            label: "About",
            sublabel: "App info & version",
            onPress: () => router.push("/about"),
        },
        {
            id: "privacy",
            icon: "shield-checkmark-outline",
            label: "Privacy Policy",
            sublabel: "busfeeapp.netlify.app",
            onPress: () => router.push("/privacy-policy"),
        },
        {
            id: "signout",
            icon: "log-out-outline",
            label: "Sign Out",
            sublabel: "Return to login screen",
            onPress: () => setShowLogoutDialog(true),
            variant: "danger",
        },
    ];

    return (
        <ScreenWrapper backgroundColor={T.background}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: T.onSurface, letterSpacing: -0.4, marginBottom: 20 }}>
                    Menu
                </Text>

                {/* Identity card */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 14,
                        backgroundColor: "#ffffff",
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: T.outline,
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <View
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 26,
                            backgroundColor: T.navyLight,
                            borderWidth: 2,
                            borderColor: T.navy,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{ fontSize: 20, fontWeight: "800", color: T.navy }}>
                            {user?.name?.charAt(0).toUpperCase() ?? "C"}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "700", color: T.onSurface }}>
                            {user?.name ?? "Class Account"}
                        </Text>
                        <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 2 }}>
                            Class Account
                        </Text>
                    </View>
                </View>

                {/* Menu items */}
                <View style={{ backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: T.outline, overflow: "hidden" }}>
                    {items.map((item, index) => (
                        <MenuRow key={item.id} item={item} isLast={index === items.length - 1} />
                    ))}
                </View>
            </ScrollView>

            {/* ── Sign Out Confirm ── */}
            <ConfirmDialog
                visible={showLogoutDialog}
                variant="warning"
                title="Sign Out?"
                subtitle="You'll be returned to the login screen."
                confirmLabel="Sign Out"
                cancelLabel="Stay"
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </ScreenWrapper>
    );
}
