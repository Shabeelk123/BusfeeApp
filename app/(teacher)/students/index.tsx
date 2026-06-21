import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    Text,
    TextInput,
    View
} from "react-native";
import ScreenWrapper from "../../../components/common/ScreenWrapper";
import StudentsList from "../../../components/students/StudentsList";
import { getCurrentUserProfile } from "../../../services/auth.service";
import { getTeacherStudents } from "../../../services/student.service";

export default function TeacherStudentsScreen() {
    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const profile = await getCurrentUserProfile();
            if (!profile) return;
            const { data, error } = await getTeacherStudents(profile.assigned_class);
            if (error) { console.log(error); return; }
            if (data) { setStudents(data); setFiltered(data); }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchStudents(); }, []));

    const handleSearch = (text: string) => {
        setSearch(text);
        if (!text.trim()) { setFiltered(students); return; }
        const lower = text.toLowerCase();
        setFiltered(students.filter(s =>
            s.full_name?.toLowerCase().includes(lower) ||
            s.admission_no?.toLowerCase().includes(lower)
        ));
    };

    return (
        <ScreenWrapper>
            <View className="flex-1">
                {/* ── Header ── */}
                <View className="mb-6 flex-row items-center justify-between">
                    <View>
                        <Text className="text-3xl font-black tracking-tight text-gray-900">Students</Text>
                        <Text className="mt-1 text-sm text-gray-500">
                            {loading ? "Loading…" : `${students.length} in your class`}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => router.push("/(teacher)/students/create")}
                        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                        className="flex-row items-center rounded-2xl bg-blue-600 px-4 py-3"
                    >
                        <Ionicons name="person-add-outline" size={16} color="white" style={{ marginRight: 6 }} />
                        <Text className="font-semibold text-white">Add</Text>
                    </Pressable>
                </View>

                {/* ── Search ── */}
                <View
                    className="mb-5 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4"
                    style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
                >
                    <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput
                        value={search}
                        onChangeText={handleSearch}
                        placeholder="Search students..."
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 py-4 text-base text-gray-900"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => handleSearch("")}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </Pressable>
                    )}
                </View>

                {/* ── List ── */}
                <StudentsList
                    students={filtered}
                    loading={loading}
                    onStudentPress={(student) =>
                        router.push({
                            pathname: "/(teacher)/students/[id]",
                            params: { id: student.id },
                        })
                    }
                />
            </View>
        </ScreenWrapper>
    );
}