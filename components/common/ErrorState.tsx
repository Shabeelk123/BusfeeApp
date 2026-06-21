import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, SafeAreaView, Text, View } from "react-native";

interface Props {
    title?: string;
    subtitle?: string;
    onRetry?: () => void;
    retryLabel?: string;
    fullScreen?: boolean;
}

export default function ErrorState({
    title = "Something went wrong",
    subtitle = "We couldn't load the data. Please try again.",
    onRetry,
    retryLabel = "Try Again",
    fullScreen = true,
}: Props) {
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]).start();
    }, [shakeAnim]);

    const content = (
        <View className="items-center px-8">
            {/* Error icon with shake */}
            <Animated.View
                style={{ transform: [{ translateX: shakeAnim }] }}
                className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-red-100"
            >
                <Ionicons name="cloud-offline-outline" size={44} color="#EF4444" />
            </Animated.View>

            <Text className="text-center text-2xl font-black text-gray-900">
                {title}
            </Text>

            <Text className="mt-3 text-center text-base leading-6 text-gray-400">
                {subtitle}
            </Text>

            {onRetry && (
                <Pressable
                    onPress={onRetry}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    className="mt-6 flex-row items-center rounded-2xl bg-red-500 px-6 py-3"
                >
                    <Ionicons
                        name="refresh-outline"
                        size={18}
                        color="white"
                        style={{ marginRight: 8 }}
                    />
                    <Text className="font-semibold text-white">{retryLabel}</Text>
                </Pressable>
            )}

            {/* Subtle hint */}
            <Text className="mt-4 text-xs text-gray-300">
                If this keeps happening, please contact support.
            </Text>
        </View>
    );

    if (fullScreen) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
                {content}
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 items-center justify-center py-20">
            {content}
        </View>
    );
}
