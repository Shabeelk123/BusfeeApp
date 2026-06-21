import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    SafeAreaView,
    Text,
    View,
} from "react-native";

interface Props {
    title?: string;
    subtitle?: string;
    fullScreen?: boolean;
}

export default function LoadingState({
    title = "Loading",
    subtitle = "Please wait a moment…",
    fullScreen = true,
}: Props) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.12,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    const content = (
        <View className="items-center justify-center px-8">
            <Animated.View
                style={{ transform: [{ scale: pulseAnim }] }}
                className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-blue-100"
            >
                <ActivityIndicator size="large" color="#2563EB" />
            </Animated.View>

            <Text className="text-xl font-bold text-gray-900">{title}</Text>

            <Text className="mt-2 text-center text-sm leading-5 text-gray-400">
                {subtitle}
            </Text>

            {/* Shimmer dots */}
            <View className="mt-5 flex-row items-center gap-x-1.5">
                {[0, 1, 2].map((i) => (
                    <DotPulse key={i} delay={i * 200} />
                ))}
            </View>
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

function DotPulse({ delay }: { delay: number }) {
    const anim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 600,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0.3,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [anim, delay]);

    return (
        <Animated.View
            style={{ opacity: anim }}
            className="h-2 w-2 rounded-full bg-blue-400"
        />
    );
}
