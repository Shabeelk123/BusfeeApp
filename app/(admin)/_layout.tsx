import {
    ActivityIndicator,
    View,
} from "react-native";

import {
    Redirect,
    Slot,
} from "expo-router";

import useCurrentUser from "../../hooks/useCurrentUser";

export default function AdminLayout() {
    const {
        profile,
        loading,
    } = useCurrentUser();

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (
        !profile ||
        profile.role !== "ADMIN"
    ) {
        return (
            <Redirect
                href="/(auth)/login"
            />
        );
    }

    return <Slot />;
}