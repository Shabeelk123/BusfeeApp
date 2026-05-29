import { ActivityIndicator, Text, View } from "react-native";

export default function SplashScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-slate-900">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600">
                <Text className="text-4xl">🚌</Text>
            </View>
            <Text className="mb-2 text-2xl font-bold tracking-wide text-white">
                BusFee Tracker
            </Text>
            <Text className="mb-10 text-sm text-slate-400">
                School Transport Management
            </Text>
            <ActivityIndicator size="small" color="#6366f1" />
        </View>
    );
}