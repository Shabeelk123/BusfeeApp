import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface Props {
    title?: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBgColor?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({
    title = "Nothing here yet",
    subtitle = "No data is available at the moment.",
    icon = "folder-open-outline",
    iconColor = "#6B7280",
    iconBgColor = "#F3F4F6",
    actionLabel,
    onAction,
}: Props) {
    return (
        <View className="mt-16 items-center px-8 pb-10">
            {/* Icon circle */}
            <View
                className="mb-5 h-24 w-24 items-center justify-center rounded-full"
                style={{ backgroundColor: iconBgColor }}
            >
                <Ionicons name={icon} size={44} color={iconColor} />
            </View>

            <Text className="text-center text-2xl font-black text-gray-900">
                {title}
            </Text>

            <Text className="mt-3 text-center text-base leading-6 text-gray-400">
                {subtitle}
            </Text>

            {actionLabel && onAction && (
                <Pressable
                    onPress={onAction}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    className="mt-6 rounded-2xl bg-blue-600 px-6 py-3"
                >
                    <Text className="font-semibold text-white">{actionLabel}</Text>
                </Pressable>
            )}
        </View>
    );
}
