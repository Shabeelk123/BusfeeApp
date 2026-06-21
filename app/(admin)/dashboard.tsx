import {
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import { useEffect, useState } from "react";

import ScreenWrapper from "@/components/common/ScreenWrapper";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import StatCard from "../../components/dashboard/StatCard";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { supabase } from "../../lib/supabase";
import { getDashboardStats } from "../../services/dashboard.service";
import { clearUser } from "../../store/authSlice";


interface Props {
    title: string;

    subtitle: string;

    icon: React.ReactNode;

    bgColor: string;

    onPress: () => void;
}

function DashboardActionCard({
    title,
    subtitle,
    icon,
    bgColor,
    onPress,
}: Props) {
    return (
        <Pressable
            onPress={onPress}
            className={`mb-4 w-[48%] rounded-3xl p-5 ${bgColor}`}
        >
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                {icon}
            </View>

            <Text className="text-lg font-bold text-slate-900">
                {title}
            </Text>

            <Text className="mt-1 text-xs leading-5 text-slate-700">
                {subtitle}
            </Text>
        </Pressable>
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
        return <LoadingState title="Loading Dashboard" subtitle="Fetching your stats…" />;
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
            <ScrollView
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View className="mb-6 flex-row items-center justify-between">
                    <View>
                        <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                            Admin Panel
                        </Text>
                        <Text className="mt-1 text-2xl font-bold text-gray-900">
                            {user?.name ?? "Admin"}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => setShowLogoutDialog(true)}
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                        className="flex-row items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2"
                    >
                        <Ionicons name="log-out-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                        <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
                    </Pressable>
                </View>

                {/* Stats Cards */}
                {/* Stats */}
                <View className="flex-row flex-wrap justify-between">
                    <StatCard
                        title="Students"
                        value={
                            stats?.totalStudents ||
                            0
                        }
                        bgColor="bg-blue-100"
                        valueColor="text-blue-900"
                        icon={
                            <Ionicons
                                name="school-outline"
                                size={28}
                                color="#2563EB"
                            />
                        }
                    />

                    <StatCard
                        title="Teachers"
                        value={
                            stats?.totalTeachers ||
                            0
                        }
                        bgColor="bg-green-100"
                        valueColor="text-green-900"
                        icon={
                            <Ionicons
                                name="people-outline"
                                size={28}
                                color="#16A34A"
                            />
                        }
                    />

                    <StatCard
                        title="Collection"
                        value={`₹${stats?.monthlyCollection || 0
                            }`}
                        bgColor="bg-purple-100"
                        valueColor="text-purple-900"
                        icon={
                            <Ionicons
                                name="card-outline"
                                size={28}
                                color="#7C3AED"
                            />
                        }
                    />

                    <StatCard
                        title="Pending"
                        value={`₹${stats?.pendingAmount || 0
                            }`}
                        bgColor="bg-red-100"
                        valueColor="text-red-900"
                        icon={
                            <Ionicons
                                name="warning-outline"
                                size={28}
                                color="#DC2626"
                            />
                        }
                    />
                </View>

                {/* Quick Actions */}
                <View className="mt-6">
                    <Text className="mb-4 text-2xl font-black text-slate-900">
                        Quick Actions
                    </Text>

                    <View className="flex-row flex-wrap justify-between">
                        <DashboardActionCard
                            title="Students"
                            subtitle="Manage students"
                            bgColor="bg-blue-100"
                            icon={
                                <Ionicons
                                    name="school-outline"
                                    size={26}
                                    color="#2563EB"
                                />
                            }
                            onPress={() =>
                                router.push(
                                    "/students"
                                )
                            }
                        />

                        <DashboardActionCard
                            title="Teachers"
                            subtitle="Manage teachers"
                            bgColor="bg-green-100"
                            icon={
                                <Ionicons
                                    name="people-outline"
                                    size={26}
                                    color="#16A34A"
                                />
                            }
                            onPress={() =>
                                router.push(
                                    "/teachers/create"
                                )
                            }
                        />

                        <DashboardActionCard
                            title="Reports"
                            subtitle="Analytics"
                            bgColor="bg-orange-100"
                            icon={
                                <Ionicons
                                    name="analytics-outline"
                                    size={26}
                                    color="#EA580C"
                                />
                            }
                            onPress={() =>
                                router.push(
                                    "/reports"
                                )
                            }
                        />

                        <DashboardActionCard
                            title="Defaulters"
                            subtitle="Pending students"
                            bgColor="bg-red-100"
                            icon={
                                <Ionicons
                                    name="warning-outline"
                                    size={26}
                                    color="#DC2626"
                                />
                            }
                            onPress={() =>
                                router.push(
                                    "/defaulters"
                                )
                            }
                        />
                    </View>
                </View>
            </ScrollView>

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