import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import AppDrawer from "@/components/common/AppDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors, Shadows } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { clearUser } from "@/store/authSlice";

function NavCard({
    iconName,
    iconBg,
    iconColor,
    title,
    subtitle,
    onPress,
}: {
    iconName: keyof typeof Ionicons.glyphMap;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ([
                {
                    marginBottom: 12,
                    borderRadius: 16,
                    backgroundColor: Colors.card,
                    padding: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    opacity: pressed ? 0.75 : 1,
                },
                Shadows.card,
            ])}
            accessibilityRole="button"
            accessibilityLabel={title}
        >
            <View
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                }}
            >
                <Ionicons name={iconName} size={26} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.textPrimary }}>
                    {title}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                    {subtitle}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>
    );
}

export default function TeacherDashboard() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(clearUser());
        router.replace("/(auth)/role-select");
    };

    return (
        <ScreenWrapper>
            {/* ── Header ── */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >
                {/* Hamburger menu */}
                <Pressable
                    onPress={() => setShowDrawer(true)}
                    style={({ pressed }) => ({
                        width: 42,
                        height: 42,
                        borderRadius: 13,
                        backgroundColor: Colors.card,
                        borderWidth: 1,
                        borderColor: Colors.cardBorderLight,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.7 : 1,
                        marginRight: 12,
                        ...Shadows.card,
                    })}
                    accessibilityRole="button"
                    accessibilityLabel="Open menu"
                >
                    <Ionicons name="menu-outline" size={22} color={Colors.textPrimary} />
                </Pressable>

                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: Colors.textSecondary,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                        }}
                    >
                        Teacher Portal
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={{
                            marginTop: 4,
                            fontSize: 22,
                            fontWeight: "800",
                            color: Colors.textPrimary,
                        }}
                    >
                        {user?.name ?? "Teacher"}
                    </Text>
                </View>
            </View>

            {/* ── Hero Banner ── */}
            <View
                style={[
                    {
                        borderRadius: 20,
                        backgroundColor: Colors.info,
                        padding: 22,
                        marginBottom: 24,
                    },
                    Shadows.cardMd,
                ]}
            >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: "700",
                                letterSpacing: 1.5,
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.65)",
                                marginBottom: 4,
                            }}
                        >
                            BusFee Tracker
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: "800", color: "white" }}>
                            Teacher Portal
                        </Text>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                            Manage your class & track fees
                        </Text>
                    </View>
                    <View
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: 18,
                            backgroundColor: "rgba(255,255,255,0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name="book" size={32} color="white" />
                    </View>
                </View>
            </View>

            {/* ── Quick Access ── */}
            <Text
                style={{
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: Colors.textMuted,
                    marginBottom: 12,
                }}
            >
                Quick Access
            </Text>

            <NavCard
                iconName="people-outline"
                iconBg={Colors.primaryLight}
                iconColor={Colors.primary}
                title="My Students"
                subtitle="View and manage class students"
                onPress={() => router.push("/(teacher)/students")}
            />
            <NavCard
                iconName="alert-circle-outline"
                iconBg={Colors.dangerLight}
                iconColor={Colors.danger}
                title="Defaulters"
                subtitle="Students with outstanding fees"
                onPress={() => router.push("/(teacher)/defaulters")}
            />

            {/* ── Info card ── */}
            <View
                style={[
                    {
                        marginTop: 8,
                        borderRadius: 16,
                        backgroundColor: Colors.card,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: Colors.cardBorderLight,
                    },
                    Shadows.card,
                ]}
            >
                <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.textPrimary }}>
                    Your Class
                </Text>
                <Text
                    style={{
                        fontSize: 13,
                        color: Colors.textSecondary,
                        marginTop: 8,
                        lineHeight: 20,
                    }}
                >
                    Monitor student fee payments, track defaulters, and manage
                    your class roster from here.
                </Text>
            </View>

            {/* ── App Drawer ── */}
            <AppDrawer
                visible={showDrawer}
                onClose={() => setShowDrawer(false)}
                userName={user?.name}
                userRole="Teacher"
                items={[
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
                ]}
            />

            {/* ── Sign Out Confirm ── */}
            <ConfirmDialog
                visible={showLogoutDialog}
                variant="warning"
                title="Sign Out?"
                subtitle="You'll be returned to the login screen. Any unsaved changes will be lost."
                confirmLabel="Sign Out"
                cancelLabel="Stay"
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </ScreenWrapper>
    );
}