import {
    Text,
    View,
} from "react-native";

interface Props {
    title: string;

    value: string | number;

    icon: React.ReactNode;

    bgColor: string;

    valueColor?: string;
}

export default function StatCard({
    title,
    value,
    icon,
    bgColor,
    valueColor = "text-slate-900",
}: Props) {
    return (
        <View
            className={`mb-4 w-[48%] rounded-3xl p-5 ${bgColor}`}
        >
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                {icon}
            </View>

            <Text
                className={`text-3xl font-black ${valueColor}`}
            >
                {value}
            </Text>

            <Text className="mt-1 text-sm font-medium text-slate-700">
                {title}
            </Text>
        </View>
    );
}