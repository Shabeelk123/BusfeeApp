import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    Text,
    View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { getStudents } from "../../services/student.service";
import { calculateFeeBalance } from "../../utils/fee";

export default function TeacherDefaultersScreen() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const { data, error } = await getStudents();
            if (error || !data) return;

            const defaulters = data.filter((student) => {
                const monthlyFee = student?.student_fee_assignments?.[0]?.monthly_fee || 0;
                const summary = calculateFeeBalance({
                    monthlyFee,
                    transactions: student?.fee_transactions || [],
                    joinDate: student.created_at,
                });
                return summary.dueAmount > 0;
            });

            setStudents(defaulters);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchStudents(); }, []));

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <View className="flex-1 px-5" style={{ paddingTop: 24 }}>
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-white">Defaulters</Text>
                    <Text className="mt-1 text-sm text-slate-400">
                        {loading ? "Loading..." : `${students.length} student${students.length !== 1 ? "s" : ""} with pending fees`}
                    </Text>
                </View>

                {!loading && students.length > 0 && (
                    <View className="mb-5 flex-row items-center rounded-xl border border-red-800 bg-red-950 p-4">
                        <Text className="mr-2 text-xl">⚠️</Text>
                        <Text className="flex-1 text-sm text-red-300">Please follow up with these students for fee collection.</Text>
                    </View>
                )}

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#6366f1" />
                    </View>
                ) : (
                    <FlatList
                        data={students}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ListEmptyComponent={() => (
                            <View className="mt-20 items-center">
                                <Text className="text-5xl">🎉</Text>
                                <Text className="mt-4 text-lg font-semibold text-slate-300">All clear!</Text>
                                <Text className="mt-1 text-sm text-slate-500">No defaulters in your class</Text>
                            </View>
                        )}
                        renderItem={({ item }) => {
                            const monthlyFee = item?.student_fee_assignments?.[0]?.monthly_fee || 0;
                            const summary = calculateFeeBalance({
                                monthlyFee,
                                transactions: item?.fee_transactions || [],
                                joinDate: item.created_at,
                            });

                            return (
                                <Pressable
                                    onPress={() => router.push({ pathname: "/(teacher)/students/[id]", params: { id: item.id } })}
                                    className="mb-4 rounded-2xl bg-slate-800 p-5 active:opacity-80"
                                >
                                    <View className="mb-3 flex-row items-start justify-between">
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-white" numberOfLines={1}>{item.full_name}</Text>
                                            <Text className="text-xs text-slate-500">#{item.admission_no}</Text>
                                        </View>
                                        <View className="rounded-xl bg-red-900 px-3 py-1.5">
                                            <Text className="text-xs font-bold text-red-300">DUE</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row gap-3">
                                        <View className="flex-1 rounded-lg bg-slate-700 p-3">
                                            <Text className="text-xs text-slate-400">Paid</Text>
                                            <Text className="mt-1 font-bold text-green-400">₹{summary.totalPaid}</Text>
                                        </View>
                                        <View className="flex-1 rounded-lg bg-red-900 p-3">
                                            <Text className="text-xs text-red-300">Due</Text>
                                            <Text className="mt-1 font-bold text-red-400">₹{summary.dueAmount}</Text>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
