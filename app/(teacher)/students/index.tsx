import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    Text,
    TextInput,
    View,
} from "react-native";
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
            if (data) {
                setStudents(data);
                setFiltered(data);
            }
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
        <SafeAreaView className="flex-1 bg-slate-900">
            <View className="flex-1 px-5" style={{ paddingTop: 24 }}>
                {/* ── Header ── */}
                <View className="mb-5 flex-row items-center justify-between">
                    <View>
                        <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            My Class
                        </Text>
                        <Text className="mt-1 text-2xl font-bold text-white">Students</Text>
                        <Text className="mt-0.5 text-sm text-slate-400">
                            {loading ? "Loading..." : `${students.length} student${students.length !== 1 ? "s" : ""}`}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => router.push("/(teacher)/students/create")}
                        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                        className="flex-row items-center rounded-xl bg-indigo-600 px-4 py-3"
                    >
                        <Text className="mr-1.5 text-base font-bold text-white">+</Text>
                        <Text className="font-semibold text-white">Add Student</Text>
                    </Pressable>
                </View>

                {/* ── Search ── */}
                <View className="mb-4 flex-row items-center rounded-xl border border-slate-700 bg-slate-800 px-4">
                    <Text className="mr-2 text-slate-500">🔍</Text>
                    <TextInput
                        value={search}
                        onChangeText={handleSearch}
                        placeholder="Search name or admission no..."
                        placeholderTextColor="#475569"
                        className="flex-1 py-3.5 text-sm text-white"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => handleSearch("")}>
                            <Text className="text-slate-500">✕</Text>
                        </Pressable>
                    )}
                </View>

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
        </SafeAreaView>
    );
}