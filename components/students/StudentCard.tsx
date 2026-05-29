import { Pressable, Text, View } from "react-native";
import { calculateFeeBalance } from "../../utils/fee";

interface Props {
    student: any;
    onPress: () => void;
}

export default function StudentCard({ student, onPress }: Props) {
    const monthlyFee = student?.student_fee_assignments?.[0]?.monthly_fee || 0;
    const transactions = student?.fee_transactions || [];
    const summary = calculateFeeBalance({
        monthlyFee,
        transactions,
        joinDate: student.created_at,
    });

    const isDue = summary.dueAmount > 0;

    return (
        <Pressable
            onPress={onPress}
            className="mb-4 rounded-2xl bg-slate-800 p-5 active:opacity-80"
        >
            <View className="mb-3 flex-row items-start justify-between">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-white" numberOfLines={1}>
                        {student.full_name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-slate-400">
                        #{student.admission_no}
                    </Text>
                </View>
                <View className={`rounded-full px-3 py-1 ${isDue ? "bg-red-900" : "bg-green-900"}`}>
                    <Text className={`text-xs font-bold ${isDue ? "text-red-400" : "text-green-400"}`}>
                        {isDue ? `₹${summary.dueAmount} Due` : "Paid"}
                    </Text>
                </View>
            </View>

            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text className="text-xs text-slate-500">Parent</Text>
                    <Text className="text-sm text-slate-300" numberOfLines={1}>{student.parent_name || "—"}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-xs text-slate-500">Class</Text>
                    <Text className="text-sm text-slate-300">{student.class_name || "—"}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-xs text-slate-500">Monthly Fee</Text>
                    <Text className="text-sm font-semibold text-indigo-400">₹{monthlyFee}</Text>
                </View>
            </View>
        </Pressable>
    );
}