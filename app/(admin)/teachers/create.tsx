import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import ScreenWrapper from "../../../components/common/ScreenWrapper";
import { createTeacher } from "../../../services/teacher.service";

interface FieldProps {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: any;
    secureTextEntry?: boolean;
    autoCapitalize?: any;
    emoji?: string;
    required?: boolean;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, emoji, required }: FieldProps) {
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
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize ?? "words"}
                className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-4 text-base text-white"
            />
        </View>
    );
}

export default function CreateTeacherScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [assignedClass, setAssignedClass] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name || !email || !password) {
            Alert.alert("Missing fields", "Name, email and password are required.");
            return;
        }
        try {
            setLoading(true);
            const { error } = await createTeacher({ name, email, password, assigned_class: assignedClass });
            if (error) { Alert.alert("Error", error.message); return; }
            Alert.alert("Teacher Created ✅", "The teacher account has been set up successfully.");
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to create teacher. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View>
                    <Pressable onPress={() => router.back()} className="mb-4">
                        <Text className="text-indigo-400">← Back</Text>
                    </Pressable>

                    <Text className="mb-1 text-2xl font-bold text-indigo-900">Create Teacher</Text>
                    <Text className="mb-6 text-sm text-slate-400">Set up a new teacher account</Text>

                    {/* Personal Info */}
                    <View className="mb-4 rounded-2xl bg-slate-800 p-5">
                        <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Teacher Information</Text>
                        <Field label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Mrs. Anita Sharma" required emoji="👩‍🏫" />
                        <Field label="Assigned Class" value={assignedClass} onChangeText={setAssignedClass} placeholder="e.g. 10-A" emoji="📚" />
                    </View>

                    {/* Credentials */}
                    <View className="mb-6 rounded-2xl bg-slate-800 p-5">
                        <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Login Credentials</Text>
                        <Field label="Email" value={email} onChangeText={setEmail} placeholder="teacher@school.com" keyboardType="email-address" required autoCapitalize="none" emoji="✉️" />
                        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" secureTextEntry required autoCapitalize="none" emoji="🔒" />
                    </View>

                    {/* Info note */}
                    <View className="mb-6 flex-row rounded-xl bg-indigo-950 border border-indigo-800 p-4">
                        <Text className="mr-2">ℹ️</Text>
                        <Text className="flex-1 text-xs text-indigo-300">
                            The teacher will be able to log in with these credentials and manage students in their assigned class.
                        </Text>
                    </View>

                    <Pressable
                        onPress={handleCreate}
                        disabled={loading}
                        className={`items-center rounded-xl py-4 ${loading ? "bg-indigo-400" : "bg-indigo-600"}`}
                    >
                        <Text className="font-bold text-white">
                            {loading ? "Creating..." : "✓ Create Teacher"}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}