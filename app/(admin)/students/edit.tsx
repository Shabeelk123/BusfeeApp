import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { getStudentById, updateStudent } from "../../../services/student.service";

interface FieldProps {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: any;
    emoji?: string;
    required?: boolean;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, emoji, required }: FieldProps) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-slate-400">
                {emoji} {label}{required && <Text className="text-red-400"> *</Text>}
            </Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#64748b"
                keyboardType={keyboardType}
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-4 text-base text-white"
            />
        </View>
    );
}

export default function EditStudentScreen() {
    const { id } = useLocalSearchParams();
    const [student, setStudent] = useState<any>(null);
    const [fullName, setFullName] = useState("");
    const [parentName, setParentName] = useState("");
    const [phone, setPhone] = useState("");
    const [className, setClassName] = useState("");
    const [busRoute, setBusRoute] = useState("");
    const [monthlyFee, setMonthlyFee] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchStudent = async () => {
        const { data } = await getStudentById(id as string);
        if (data) {
            setStudent(data);
            setFullName(data.full_name);
            setParentName(data.parent_name);
            setPhone(data.phone);
            setClassName(data.class_name);
            setBusRoute(data.bus_route);
            setMonthlyFee(String(data?.student_fee_assignments?.[0]?.monthly_fee || ""));
        }
    };

    useEffect(() => { fetchStudent(); }, []);

    const handleUpdate = async () => {
        if (!student) return;
        try {
            setLoading(true);
            const feeAssignment =
                student?.student_fee_assignments?.[0];

            const { error } =
                await updateStudent({
                    studentId:
                        student.id,

                    feeAssignmentId:
                        feeAssignment?.id,

                    studentData: {
                        full_name:
                            fullName,

                        parent_name:
                            parentName,

                        phone,

                        class_name:
                            className,

                        bus_route:
                            busRoute,
                    },

                    monthlyFee:
                        Number(monthlyFee),
                });
            if (error) { Alert.alert("Error", error.message); return; }
            Alert.alert("Updated! ✅", "Student record has been updated.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="px-5 pt-6">
                        <Pressable onPress={() => router.back()} className="mb-4">
                            <Text className="text-indigo-400">← Back</Text>
                        </Pressable>
                        <Text className="mb-1 text-2xl font-bold text-white">Edit Student</Text>
                        <Text className="mb-6 text-sm text-slate-400">Update the student's details</Text>

                        <View className="rounded-2xl bg-slate-800 p-5">
                            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Personal Information</Text>
                            <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Full name" emoji="👤" required />
                            <Field label="Parent Name" value={parentName} onChangeText={setParentName} placeholder="Parent name" emoji="👨‍👩‍👧" />
                            <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" emoji="📞" />
                        </View>

                        <View className="mt-4 rounded-2xl bg-slate-800 p-5">
                            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">School Details</Text>
                            <Field label="Class" value={className} onChangeText={setClassName} placeholder="e.g. 10-A" emoji="📚" />
                            <Field label="Bus Route" value={busRoute} onChangeText={setBusRoute} placeholder="e.g. Route 3" emoji="🚌" />
                            <Field label="Monthly Fee (₹)" value={monthlyFee} onChangeText={setMonthlyFee} placeholder="e.g. 1200" keyboardType="numeric" emoji="💰" required />
                        </View>

                        <Pressable
                            onPress={handleUpdate}
                            disabled={loading}
                            className={`mt-6 items-center rounded-xl py-4 ${loading ? "bg-indigo-400" : "bg-indigo-600"}`}
                        >
                            <Text className="font-bold text-white">
                                {loading ? "Updating..." : "✓ Update Student"}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}