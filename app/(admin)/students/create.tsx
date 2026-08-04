import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import AppButton from "@/components/common/AppButton";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import StudentForm from "@/components/students/StudentForm";
import { Colors, Shadows } from "@/constants/colors";
import { createStudent } from "@/services/student.service";

interface Credentials {
    email: string;
    password: string;
}

export default function CreateStudentScreen() {
    const toast = useToast();
    const [studentName, setStudentName] = useState("");
    const [credentials, setCredentials] = useState<Credentials | null>(null);

    // ── Success view: generated credentials ──
    if (credentials) {
        return (
            <ScreenWrapper>
                <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 48 }}
                >
                    <PageHeader
                        title="Student Created"
                        subtitle={`Login credentials for ${studentName}`}
                    />

                    <View
                        style={{ marginBottom: 20 }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                            <View
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    backgroundColor: Colors.primaryLight,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 8,
                                }}
                            >
                                <Ionicons name="key-outline" size={15} color={Colors.primary} />
                            </View>
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color: Colors.textSecondary,
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                }}
                            >
                                Student Login
                            </Text>
                        </View>

                        <View
                            style={[
                                {
                                    backgroundColor: Colors.card,
                                    borderRadius: 16,
                                    padding: 16,
                                    borderWidth: 1,
                                    borderColor: Colors.cardBorderLight,
                                },
                                Shadows.card,
                            ]}
                        >
                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>Email</Text>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.textPrimary }}>
                                    {credentials.email}
                                </Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>Password</Text>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.textPrimary }}>
                                    {credentials.password}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            borderRadius: 12,
                            backgroundColor: Colors.warningLight,
                            borderWidth: 1,
                            borderColor: Colors.warningBorder,
                            padding: 14,
                            marginBottom: 24,
                        }}
                    >
                        <Ionicons
                            name="warning-outline"
                            size={18}
                            color={Colors.warning}
                            style={{ marginRight: 10, marginTop: 1 }}
                        />
                        <Text style={{ flex: 1, fontSize: 12, color: Colors.warning, lineHeight: 18 }}>
                            Save these credentials now and share them with the student — the password will not be shown again after you leave this screen.
                        </Text>
                    </View>

                    <AppButton
                        label="Done"
                        onPress={() => router.back()}
                        fullWidth
                        iconLeft="checkmark-circle-outline"
                    />
                </KeyboardAwareScrollView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={40}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                <PageHeader
                    title="Add Student"
                    subtitle="Create a new student profile"
                    showBack
                />

                <StudentForm
                    mode="create"
                    submitLabel="Create Student"
                    onSubmit={async (values) => {
                        const { data, error } = await createStudent({
                            name: values.name,
                            admission_no: values.admissionNo,
                            grade_id: values.gradeId,
                            division_id: values.divisionId,
                            monthly_fee: values.monthlyFee,
                        });

                        if (data) {
                            setStudentName(data.name);
                            setCredentials(data.credentials);
                        }

                        return { error };
                    }}
                    onSuccess={() => {
                        toast.success("Success", "Student profile created successfully");
                    }}
                />
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}
