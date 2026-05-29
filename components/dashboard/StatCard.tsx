import {
    Text,
    View,
} from "react-native";

interface Props {
    title: string;

    value: string | number;

    color?: string;
}

export default function StatCard({
    title,
    value,
    color = "bg-blue-600",
}: Props) {
    return (
        <View className="mb-4 w-[48%] rounded-3xl bg-white p-5 shadow-sm">
            <View
                className={`mb-4 h-12 w-12 items-center justify-center rounded-2xl ${color}`}
            >
                <Text className="text-lg font-bold text-white">
                    ₹
                </Text>
            </View>

            <Text className="text-3xl font-black text-gray-900">
                {value}
            </Text>

            <Text className="mt-1 text-sm text-gray-500">
                {title}
            </Text>
        </View>
    );
}