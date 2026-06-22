import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import AppButton from "@/components/common/AppButton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors, Shadows } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { supabase } from "@/lib/supabase";
import { getDashboardStats } from "@/services/dashboard.service";
import { clearUser } from "@/store/authSlice";

function StatTile({
    title,
    value,
    icon,
    color,
    backgroundColor,
}: {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    backgroundColor: string;
}) {
    return (
        <View
            style={[
                {
                    width: "48%",
                    marginBottom: 12,
                    borderRadius: 16,
                    backgroundColor: Colors.card,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    padding: 16,
                    minHeight: 128,
                },
                Shadows.card,
            ]}
        >
            <View
                style={{
                    height: 44,
                    width: 44,
                    borderRadius: 14,
                    backgroundColor,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                }}
            >
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <Text numberOfLines={1} style={{ color: Colors.textPrimary, fontSize: 24, fontWeight: "800" }}>
                {value}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 4 }}>
                {title}
            </Text>
        </View>
    );
}

export default function DashboardScreen() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const fetchStats = async () => {
        try {
            setError(false);
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.log(error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(clearUser());
        router.replace("/(auth)/login");
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

    return (
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ marginBottom: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>
                            Admin Panel
                        </Text>
                        <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 24, fontWeight: "800", color: Colors.textPrimary }}>
                            {user?.name ?? "Admin"}
                        </Text>
                    </View>
                    <AppButton
                        label="Sign Out"
                        onPress={() => setShowLogoutDialog(true)}
                        variant="danger"
                        size="sm"
                        iconLeft="log-out-outline"
                    />
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
                    <StatTile
                        title="Students"
                        value={stats?.totalStudents || 0}
                        color={Colors.primary}
                        backgroundColor={Colors.primaryLight}
                        icon="school-outline"
                    />
                    <StatTile
                        title="Teachers"
                        value={stats?.totalTeachers || 0}
                        color={Colors.success}
                        backgroundColor={Colors.successLight}
                        icon="people-outline"
                    />
                    <StatTile
                        title="Collection"
                        value={`Rs ${stats?.monthlyCollection || 0}`}
                        color={Colors.info}
                        backgroundColor={Colors.infoLight}
                        icon="card-outline"
                    />
                    <StatTile
                        title="Pending"
                        value={`Rs ${stats?.pendingAmount || 0}`}
                        color={Colors.danger}
                        backgroundColor={Colors.dangerLight}
                        icon="warning-outline"
                    />
                </View>

                <View style={{ marginBottom: 32 }}>
                    <Text style={{ marginBottom: 16, fontSize: 16, fontWeight: "800", color: Colors.textPrimary }}>
                        Quick Actions
                    </Text>
                    <View style={{ gap: 12 }}>
                        <AppButton
                            label="Manage Students"
                            onPress={() => router.push("/(admin)/students")}
                            variant="primary"
                            fullWidth
                            iconLeft="school-outline"
                        />
                        <AppButton
                            label="Manage Teachers"
                            onPress={() => router.push("/(admin)/teachers")}
                            variant="primary"
                            fullWidth
                            iconLeft="people-outline"
                        />
                        <AppButton
                            label="View Reports"
                            onPress={() => router.push("/(admin)/reports")}
                            variant="secondary"
                            fullWidth
                            iconLeft="document-outline"
                        />
                        <AppButton
                            label="View Defaulters"
                            onPress={() => router.push("/(admin)/defaulters")}
                            variant="secondary"
                            fullWidth
                            iconLeft="warning-outline"
                        />
                    </View>
                </View>
            </ScrollView>

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
