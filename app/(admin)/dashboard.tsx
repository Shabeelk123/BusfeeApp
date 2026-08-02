import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import AppDrawer from "@/components/common/AppDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { getDashboardStats } from "@/services/dashboard.service";
import { clearUser } from "@/store/authSlice";

// ─── Design Tokens (Stitch: "High-End Fintech Mobile Admin") ──────────────────
const T = {
    background:             "#fbf8ff",
    surface:                "#ffffff",
    surfaceContainer:       "#eeedf8",
    surfaceContainerLow:    "#f4f2fe",
    primary:                "#1a40c2",
    primaryContainer:       "#3b5bdb",
    onPrimary:              "#ffffff",
    onPrimaryContainer:     "#e2e5ff",
    primaryFixed:           "#dde1ff",
    secondary:              "#505f76",
    onSurface:              "#1a1b23",
    onSurfaceVariant:       "#444654",
    outline:                "#747686",
    outlineVariant:         "#c4c5d6",
    error:                  "#ba1a1a",
    errorContainer:         "#ffdad6",
    success:                "#0d7f4e",
    successLight:           "#d1fae5",
    warning:                "#863700",
    warningLight:           "#ffdbcb",
    info:                   "#505f76",
    infoLight:              "#d0e1fb",
} as const;

const S = StyleSheet.create({
    // Cards
    card: {
        backgroundColor: T.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
        borderWidth: 1,
        borderColor: T.outlineVariant,
    },
    // Section heading
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: T.onSurface,
        letterSpacing: -0.01 * 16,
        marginBottom: 12,
    },
});

// ─── Hero Stats Card ──────────────────────────────────────────────────────────
function HeroCard({
    totalCollection,
    pendingAmount,
}: {
    totalCollection: number;
    pendingAmount: number;
}) {
    // target = what was collected + what is still owed = total expected this period
    const target = totalCollection + pendingAmount;
    const pct = target > 0 ? Math.round((totalCollection / target) * 100) : 0;

    return (
        <View
            style={{
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                backgroundColor: "#1a40c2",
                shadowColor: "#1a40c2",
                shadowOpacity: 0.28,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
            }}
        >
            {/* Outstanding Dues */}
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", letterSpacing: 0.02 * 12, textTransform: "uppercase", marginBottom: 2 }}>
                Outstanding Dues
            </Text>
            <Text style={{ fontSize: 32, fontWeight: "700", color: "#ffffff", letterSpacing: -0.03 * 32, marginBottom: 16 }}>
                Rs {pendingAmount.toLocaleString()}
            </Text>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 16 }} />

            {/* Total Collection (current month) */}
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", letterSpacing: 0.02 * 12, textTransform: "uppercase", marginBottom: 2 }}>
                This Month's Collection
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#ffffff", letterSpacing: -0.02 * 24, marginBottom: 10 }}>
                Rs {totalCollection.toLocaleString()}
            </Text>

            {/* Progress bar: collection vs total expected */}
            <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, overflow: "hidden" }}>
                <View
                    style={{
                        width: `${pct}%`,
                        height: 6,
                        backgroundColor: "#ffffff",
                        borderRadius: 999,
                    }}
                />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
                {pct}% of expected collected
            </Text>
        </View>
    );
}

// ─── Counter Tile ─────────────────────────────────────────────────────────────
function CounterTile({
    label,
    value,
    icon,
    iconColor,
    iconBg,
}: {
    label: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <View style={[S.card, { flex: 1 }]}>
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                }}
            >
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: T.onSurface, letterSpacing: -0.02 * 28 }}>
                {value}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: T.onSurfaceVariant, marginTop: 2, letterSpacing: 0.01 }}>
                {label}
            </Text>
        </View>
    );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({
    icon,
    label,
    onPress,
    accent,
    accentBg,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    accent: string;
    accentBg: string;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                gap: 8,
                opacity: pressed ? 0.7 : 1,
            })}
        >
            <View
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    backgroundColor: accentBg,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: accent,
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 3,
                }}
            >
                <Ionicons name={icon} size={26} color={accent} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: T.onSurfaceVariant, textAlign: "center" }}>
                {label}
            </Text>
        </Pressable>
    );
}

// ─── Management Row Card ──────────────────────────────────────────────────────
function ManagementRow({
    icon,
    label,
    sublabel,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sublabel: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 14,
                opacity: pressed ? 0.75 : 1,
            })}
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: T.primaryFixed,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={22} color={T.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: T.onSurface }}>{label}</Text>
                <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 1 }}>{sublabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.outline} />
        </Pressable>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const fetchStats = async () => {
        try {
            setError(false);
            const data = await getDashboardStats();
            setStats(data);
        } catch (err) {
            console.log(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(clearUser());
        router.replace("/(auth)/role-select");
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading) {
        return <LoadingState title="Loading Dashboard" subtitle="Fetching your stats..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Dashboard Unavailable"
                subtitle="Could not load dashboard stats. Please try again."
                onRetry={fetchStats}
            />
        );
    }

    const totalCollection    = stats?.monthlyCollection   || 0;
    const pendingAmount      = stats?.pendingAmount        || 0;
    const totalStudents      = stats?.totalStudents        || 0;
    const totalClassAccounts = stats?.totalClassAccounts   || 0;

    return (
        <ScreenWrapper backgroundColor={T.background}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}
            >
                {/* ── Header ── */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    {/* Greeting */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: T.onSurfaceVariant, letterSpacing: 0.02 * 12, textTransform: "uppercase" }}>
                            Admin Panel
                        </Text>
                        <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 22, fontWeight: "800", color: T.onSurface, letterSpacing: -0.02 * 22 }}>
                            {user?.name ?? "Admin"}
                        </Text>
                    </View>

                    {/* Menu icon */}
                    <Pressable
                        onPress={() => setShowDrawer(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Open menu"
                        style={({ pressed }) => ({
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: T.surface,
                            borderWidth: 1,
                            borderColor: T.outlineVariant,
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: pressed ? 0.7 : 1,
                            shadowColor: "#000",
                            shadowOpacity: 0.04,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 2,
                        })}
                    >
                        <Ionicons name="menu-outline" size={22} color={T.onSurface} />
                    </Pressable>
                </View>

                {/* ── Hero Card: Dues + Collection ── */}
                <HeroCard
                    totalCollection={totalCollection}
                    pendingAmount={pendingAmount}
                />

                {/* ── Counter Tiles ── */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                    <CounterTile
                        label="Class Accounts"
                        value={totalClassAccounts}
                        icon="people-outline"
                        iconColor={T.success}
                        iconBg={T.successLight}
                    />
                    <CounterTile
                        label="Enrolled Students"
                        value={totalStudents}
                        icon="school-outline"
                        iconColor={T.primary}
                        iconBg={T.primaryFixed}
                    />
                </View>


                {/* ── Quick Actions (icon grid) ── */}
                <View style={[S.card, { marginBottom: 20 }]}>
                    <Text style={S.sectionTitle}>Quick Actions</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <QuickAction
                            icon="school-outline"
                            label="Students"
                            onPress={() => router.push("/(admin)/students")}
                            accent={T.primary}
                            accentBg={T.primaryFixed}
                        />
                        <QuickAction
                            icon="people-outline"
                            label="Teachers"
                            onPress={() => router.push("/(admin)/teachers")}
                            accent={T.success}
                            accentBg={T.successLight}
                        />
                        <QuickAction
                            icon="document-text-outline"
                            label="Reports"
                            onPress={() => router.push("/(admin)/reports")}
                            accent={T.info}
                            accentBg={T.infoLight}
                        />
                        <QuickAction
                            icon="warning-outline"
                            label="Dues"
                            onPress={() => router.push("/(admin)/defaulters")}
                            accent={T.warning}
                            accentBg={T.warningLight}
                        />
                    </View>
                </View>

                {/* ── Quick Management (detailed rows) ── */}
                <View style={S.card}>
                    <Text style={S.sectionTitle}>Quick Management</Text>

                    <ManagementRow
                        icon="school-outline"
                        label="Manage Students"
                        sublabel="Edit, add or remove student profiles"
                        onPress={() => router.push("/(admin)/students")}
                    />

                    <View style={{ height: 1, backgroundColor: T.outlineVariant }} />

                    <ManagementRow
                        icon="people-outline"
                        label="Manage Teachers"
                        sublabel="Assign classes and payroll updates"
                        onPress={() => router.push("/(admin)/teachers")}
                    />
                </View>
            </ScrollView>

            {/* ── App Drawer ── */}
            <AppDrawer
                visible={showDrawer}
                onClose={() => setShowDrawer(false)}
                userName={user?.name}
                userRole="Administrator"
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
                subtitle="You'll be returned to the login screen."
                confirmLabel="Sign Out"
                cancelLabel="Stay"
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </ScreenWrapper>
    );
}
