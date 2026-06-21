import ScreenWrapper from "@/components/common/ScreenWrapper";
import { getClasses } from "@/services/class.service";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    Text,
    View,
} from "react-native";
import AppSelect from "../../../components/common/AppSelect";
import { getCurrentMonthDefaulters } from "../../../services/defaulters.service";

export default function DefaultersScreen() {
    const [students, setStudents] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("ALL");
    const [classes, setClasses] = useState<string[]>(["ALL"]);
    const [loading, setLoading] = useState(true);

    const fetchClasses = async () => {
        const { data, error } = await getClasses();
        if (error) { console.log(error); return; }
        setClasses(data);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data, error } = await getCurrentMonthDefaulters({ selectedClass });
            if (error) { console.log(error); return; }
            setStudents(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClasses(); fetchData(); }, []);
    useEffect(() => { fetchData(); }, [selectedClass]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-3 text-sm text-gray-400">Loading defaulters…</Text>
            </SafeAreaView>
        );
    }

    return (
        <ScreenWrapper>
            <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        <View className="mb-5">
                            <Text className="text-3xl font-black text-gray-900">Defaulters</Text>
                            <Text className="mt-1 text-gray-500">Current month pending students</Text>
                        </View>

                        <AppSelect
                            value={selectedClass}
                            options={classes.map(
                                (item) => ({
                                    label: item,
                                    value: item,
                                })
                            )}
                            onChange={(value) =>
                                setSelectedClass(
                                    String(value)
                                )
                            }
                        />

                        {students.length > 0 && (
                            <View className="mb-5 flex-row items-center rounded-2xl border border-red-200 bg-red-50 p-4">
                                <Ionicons name="warning-outline" size={22} color="#ef4444" style={{ marginRight: 10 }} />
                                <Text className="flex-1 text-sm text-red-600">
                                    These students have outstanding fee dues. Please follow up.
                                </Text>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={
                    <View className="mt-20 items-center">
                        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                            <Ionicons name="checkmark-circle" size={48} color="#059669" />
                        </View>
                        <Text className="text-2xl font-black text-gray-900">No Defaulters</Text>
                        <Text className="mt-3 text-center text-base leading-6 text-gray-500">
                            All students cleared their current month dues
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View
                        className="mb-4 rounded-3xl border border-red-100 bg-white p-5"
                        style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
                    >
                        <View className="mb-3 flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-gray-900">{item.full_name}</Text>
                                <Text className="mt-0.5 text-sm text-gray-500">Class: {item.class_name}</Text>
                            </View>
                            <View className="rounded-full bg-red-100 px-3 py-1">
                                <Text className="text-xs font-bold text-red-600">DUE</Text>
                            </View>
                        </View>
                        <View className="flex-row justify-between">
                            <View className="flex-1 items-center rounded-xl bg-gray-50 p-3">
                                <Ionicons name="cash-outline" size={16} color="#6B7280" />
                                <Text className="mt-1 text-xs text-gray-400">Monthly Fee</Text>
                                <Text className="mt-0.5 font-bold text-gray-900">₹{item.monthlyFee}</Text>
                            </View>
                            <View className="mx-2 flex-1 items-center rounded-xl bg-emerald-50 p-3">
                                <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                                <Text className="mt-1 text-xs text-gray-400">Paid</Text>
                                <Text className="mt-0.5 font-bold text-emerald-600">₹{item.paid}</Text>
                            </View>
                            <View className="flex-1 items-center rounded-xl bg-red-50 p-3">
                                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                                <Text className="mt-1 text-xs text-gray-400">Pending</Text>
                                <Text className="mt-0.5 font-bold text-red-600">₹{item.pending}</Text>
                            </View>
                        </View>
                    </View>
                )}
            />
        </ScreenWrapper>
    );
}