import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Pressable,
    Text,
    View
} from "react-native";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { supabase } from "../../lib/supabase";
import { clearUser } from "../../store/authSlice";

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
            style={({ pressed }) => ({
                opacity: pressed ? 0.75 : 1,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
            })}
            className="mb-4 flex-row items-center rounded-3xl bg-white p-5"
        >
            <View className={`mr-4 h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}>
                <Ionicons name={iconName} size={28} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">{title}</Text>
                <Text className="mt-1 text-sm text-gray-500">{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
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
        <ScreenWrapper>
            {/* ── Header ── */}
            <View className="mb-6 flex-row items-center justify-between">
                <View>
                    <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Teacher Portal
                    </Text>
                    <Text className="mt-1 text-2xl font-bold text-gray-900">
                        {user?.name ?? "Teacher"}
                    </Text>
                </View>
                <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    className="flex-row items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2"
                >
                    <Ionicons name="log-out-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                    <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
                </Pressable>
            </View>

            {/* ── Hero Banner ── */}
            <View
                className="mb-6 overflow-hidden rounded-3xl bg-purple-600 p-6"
                style={{ shadowColor: "#7c3aed", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className="text-xs font-bold uppercase tracking-widest text-purple-200">
                            BusFee Tracker
                        </Text>
                        <Text className="mt-1.5 text-xl font-bold text-white">Teacher Portal</Text>
                        <Text className="mt-1 text-sm text-purple-200">Manage your class & track fees</Text>
                    </View>
                    <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                        <Ionicons name="book" size={36} color="white" />
                    </View>
                </View>
            </View>

            {/* ── Quick Access ── */}
            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                Quick Access
            </Text>

            <NavCard
                iconName="people-outline"
                iconBg="bg-blue-100"
                iconColor="#2563eb"
                title="My Students"
                subtitle="View and manage class students"
                onPress={() => router.push("/(teacher)/students")}
            />
            <NavCard
                iconName="alert-circle-outline"
                iconBg="bg-red-100"
                iconColor="#ef4444"
                title="Defaulters"
                subtitle="Students with outstanding fees"
                onPress={() => router.push("/(teacher)/defaulters")}
            />

            {/* ── Bottom info card ── */}
            <View className="mt-2 rounded-3xl bg-white p-6 shadow-sm">
                <Text className="text-xl font-bold text-gray-900">Your Class</Text>
                <Text className="mt-2 leading-6 text-gray-500">
                    Monitor student fee payments, track defaulters, and manage your class roster from here.
                </Text>
            </View>
        </ScreenWrapper>
    );
}