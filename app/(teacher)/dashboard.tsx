import { router } from "expo-router";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { supabase } from "../../lib/supabase";
import { clearUser } from "../../store/authSlice";

interface NavCardProps {
    emoji: string;
    title: string;
    subtitle: string;
    color: string;
    onPress: () => void;
}

function NavCard({ emoji, title, subtitle, color, onPress }: NavCardProps) {
    return (
        <Pressable
            onPress={onPress}
            className="mb-4 flex-row items-center rounded-2xl bg-slate-800 p-5 active:opacity-80"
        >
            <View className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Text className="text-xl">{emoji}</Text>
            </View>
            <View className="flex-1">
                <Text className="font-bold text-white">{title}</Text>
                <Text className="mt-0.5 text-xs text-slate-400">{subtitle}</Text>
            </View>
            <Text className="text-slate-500">›</Text>
        </Pressable>
    );
}

export default function TeacherDashboard() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(clearUser());
        router.replace("/(auth)/login");
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
            >
                {/* Header */}
                <View className="mb-8 flex-row items-center justify-between">
                    <View>
                        <Text className="text-sm text-slate-400">Welcome back,</Text>
                        <Text className="text-2xl font-bold text-white">
                            {user?.name ?? "Teacher"} 👋
                        </Text>
                    </View>
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                        <Text className="text-xl">👩‍🏫</Text>
                    </View>
                </View>

                {/* Banner */}
                <View className="mb-8 rounded-2xl bg-purple-700 p-5">
                    <Text className="text-xs font-semibold uppercase tracking-widest text-purple-200">
                        Teacher Panel
                    </Text>
                    <Text className="mt-1 text-xl font-bold text-white">Class Management</Text>
                    <Text className="mt-1 text-sm text-purple-200">
                        Manage your students and track fee payments
                    </Text>
                </View>

                <Text className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Quick Access</Text>

                <NavCard
                    emoji="🎓"
                    title="My Students"
                    subtitle="View and manage class students"
                    color="bg-blue-600"
                    onPress={() => router.push("/(teacher)/students")}
                />
                <NavCard
                    emoji="⚠️"
                    title="Defaulters"
                    subtitle="Students with pending fees"
                    color="bg-red-600"
                    onPress={() => router.push("/(teacher)/defaulters")}
                />

                {/* Logout */}
                <Pressable
                    onPress={handleLogout}
                    className="mt-4 flex-row items-center justify-center rounded-2xl border border-red-800 bg-red-950 py-4 active:opacity-80"
                >
                    <Text className="mr-2">🚪</Text>
                    <Text className="font-semibold text-red-400">Sign Out</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}