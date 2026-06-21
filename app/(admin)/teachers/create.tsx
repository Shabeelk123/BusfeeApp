import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../../components/common/AppButton";
import AppInput from "../../../components/common/AppInput";
import PageHeader from "../../../components/common/PageHeader";
import { useToast } from "../../../components/common/ToastContext";
import { Colors, Shadows } from "../../../constants/colors";
import { createTeacher } from "../../../services/teacher.service";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View
            style={[
                {
                    borderRadius: 16,
                    backgroundColor: Colors.card,
                    padding: 20,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                },
                Shadows.card,
            ]}
        >
            <Text
                style={{
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: Colors.textMuted,
                    marginBottom: 16,
                }}
            >
                {title}
            </Text>
            {children}
        </View>
    );
}

export default function CreateTeacherScreen() {
    const toast = useToast();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [assignedClass, setAssignedClass] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name || !email || !password) {
            toast.warning("Missing Fields", "Name, email and password are required.");
            return;
        }
        try {
            setLoading(true);
            const { error } = await createTeacher({ name, email, password, assigned_class: assignedClass });
            if (error) { toast.error("Create Failed", error.message); return; }
            toast.success("Teacher Added", "The teacher account has been set up successfully.");
            router.back();
        } catch {
            toast.error("Network Error", "Failed to create teacher. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
            >
                <PageHeader title="Create Teacher" subtitle="Set up a new teacher account" showBack />

                <SectionCard title="Teacher Information">
                    <AppInput
                        label="Full Name"
                        required
                        iconName="person-outline"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Mrs. Anita Sharma"
                        autoCapitalize="words"
                    />
                    <AppInput
                        label="Assigned Class"
                        iconName="book-outline"
                        value={assignedClass}
                        onChangeText={setAssignedClass}
                        placeholder="e.g. 10-A"
                        autoCapitalize="characters"
                    />
                </SectionCard>

                <SectionCard title="Login Credentials">
                    <AppInput
                        label="Email"
                        required
                        iconName="mail-outline"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="teacher@school.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />
                    {/* Password with show/hide toggle */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6, marginLeft: 2 }}>
                            Password <Text style={{ color: Colors.danger }}>*</Text>
                        </Text>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: Colors.inputBorder,
                                backgroundColor: Colors.inputBg,
                                paddingHorizontal: 14,
                                minHeight: 50,
                            }}
                        >
                            <Ionicons name="lock-closed-outline" size={18} color={Colors.iconDefault} style={{ marginRight: 10 }} />
                            <AppInput
                                style={{ flex: 1, marginBottom: 0 }}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Min. 6 characters"
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} accessibilityLabel="Toggle password visibility">
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.iconDefault} />
                            </Pressable>
                        </View>
                    </View>
                </SectionCard>

                {/* Info note */}
                <View
                    style={{
                        flexDirection: "row",
                        borderRadius: 12,
                        backgroundColor: Colors.primaryLight,
                        borderWidth: 1,
                        borderColor: Colors.primaryBorder,
                        padding: 14,
                        marginBottom: 24,
                    }}
                >
                    <Ionicons name="information-circle-outline" size={18} color={Colors.primary} style={{ marginRight: 10, marginTop: 1 }} />
                    <Text style={{ flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 }}>
                        The teacher will log in with these credentials and manage students in their assigned class.
                    </Text>
                </View>

                <AppButton
                    label="Create Teacher"
                    onPress={handleCreate}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    iconLeft="person-add-outline"
                />
            </ScrollView>
        </SafeAreaView>
    );
}