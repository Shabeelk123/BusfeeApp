import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    useEffect,
    useState,
} from "react";

import { router } from "expo-router";

import StatCard from "../../components/dashboard/StatCard";

import { getDashboardStats } from "../../services/dashboard.service";

interface ActionCardProps {
    title: string;

    subtitle: string;

    emoji: string;

    onPress: () => void;
}

function DashboardActionCard({
    title,
    subtitle,
    emoji,
    onPress,
}: ActionCardProps) {
    return (
        <Pressable
            onPress={onPress}
            className="mb-4 w-[48%] rounded-3xl bg-white p-5 shadow-sm"
        >
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                <Text className="text-2xl">
                    {emoji}
                </Text>
            </View>

            <Text className="text-lg font-bold text-gray-900">
                {title}
            </Text>

            <Text className="mt-1 text-sm leading-5 text-gray-500">
                {subtitle}
            </Text>
        </Pressable>
    );
}

export default function DashboardScreen() {
    const [stats, setStats] =
        useState<any>(null);

    const [loading, setLoading] =
        useState(true);

    const fetchStats =
        async () => {
            try {
                const data =
                    await getDashboardStats();

                setStats(data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 40,
                }}
            >
                {/* Header */}
                <View className="mb-8">
                    <Text className="text-4xl font-black tracking-tight text-gray-900">
                        Dashboard
                    </Text>

                    <Text className="mt-2 text-base text-gray-500">
                        School ERP overview
                    </Text>
                </View>

                {/* Stats Cards */}
                <View className="flex-row flex-wrap justify-between">
                    <StatCard
                        title="Students"
                        value={
                            stats?.totalStudents ||
                            0
                        }
                        color="bg-blue-600"
                    />

                    <StatCard
                        title="Teachers"
                        value={
                            stats?.totalTeachers ||
                            0
                        }
                        color="bg-green-600"
                    />

                    <StatCard
                        title="Collection"
                        value={`₹${stats?.monthlyCollection || 0
                            }`}
                        color="bg-purple-600"
                    />

                    <StatCard
                        title="Monthly Fees"
                        value={`₹${stats?.pendingAmount || 0
                            }`}
                        color="bg-orange-500"
                    />
                </View>

                {/* Quick Actions */}
                <View className="mt-6">
                    <Text className="mb-4 text-2xl font-black text-gray-900">
                        Quick Actions
                    </Text>

                    <View className="flex-row flex-wrap justify-between">
                        <DashboardActionCard
                            title="Students"
                            subtitle="Manage students"
                            emoji="🎓"
                            onPress={() =>
                                router.push(
                                    "/students"
                                )
                            }
                        />

                        <DashboardActionCard
                            title="Teachers"
                            subtitle="Manage teachers"
                            emoji="👨‍🏫"
                            onPress={() =>
                                router.push(
                                    "/teachers/create"
                                )
                            }
                        />

                        <DashboardActionCard
                            title="Defaulters"
                            subtitle="Pending students"
                            emoji="⚠️"
                            onPress={() =>
                                router.push(
                                    "/defaulters"
                                )
                            }
                        />

                        <DashboardActionCard
                            title="Reports"
                            subtitle="Analytics & exports"
                            emoji="📊"
                            onPress={() =>
                                router.push(
                                    "/reports"
                                )
                            }
                        />
                    </View>
                </View>

                {/* Bottom Section */}
                <View className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                    <Text className="text-xl font-bold text-gray-900">
                        Current Month
                    </Text>

                    <Text className="mt-2 leading-6 text-gray-500">
                        Track collections,
                        pending dues, student
                        management, and
                        operational insights
                        from your ERP system.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}