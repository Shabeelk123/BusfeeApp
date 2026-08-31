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
import { createStudent } from "@/services/student.service";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background:  "#f7fafc",
    navy:        "#1a2b48",
    navyLight:   "#e8ebf2",
    onSurface:   "#181c1e",
    onSurfaceVariant: "#44474d",
    outline:     "#e2e8f0",
    warning:     "#b7791f",
    warningLight:"#fdf3e0",
} as const;

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
            <ScreenWrapper backgroundColor={T.background}>
                <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 48 }}
                >
                    <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>
                        <PageHeader
                            title="Student Created"
                            subtitle={`Login credentials for ${studentName}`}
                        />

                        <View style={{ marginBottom: 20 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                <View
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        backgroundColor: T.navyLight,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 8,
                                    }}
                                >
                                    <Ionicons name="key-outline" size={15} color={T.navy} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: "700",
                                        color: T.onSurfaceVariant,
                                        textTransform: "uppercase",
                                        letterSpacing: 1,
                                    }}
                                >
                                    Student Login
                                </Text>
                            </View>

                            <View
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: 16,
                                    padding: 16,
                                    borderWidth: 1,
                                    borderColor: T.outline,
                                }}
                            >
                                <View style={{ marginBottom: 12 }}>
                                    <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginBottom: 2 }}>Email</Text>
                                    <Text style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>
                                        {credentials.email}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginBottom: 2 }}>Password</Text>
                                    <Text style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>
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
                                backgroundColor: T.warningLight,
                                borderWidth: 1,
                                borderColor: T.warning,
                                padding: 14,
                                marginBottom: 24,
                            }}
                        >
                            <Ionicons
                                name="warning-outline"
                                size={18}
                                color={T.warning}
                                style={{ marginRight: 10, marginTop: 1 }}
                            />
                            <Text style={{ flex: 1, fontSize: 12, color: T.warning, lineHeight: 18 }}>
                                Save these credentials now and share them with the student — the password will not be shown again after you leave this screen.
                            </Text>
                        </View>

                        <AppButton
                            label="Done"
                            onPress={() => router.back()}
                            fullWidth
                            variant="navy"
                            iconLeft="checkmark-circle-outline"
                        />
                    </View>
                </KeyboardAwareScrollView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={T.background}>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={40}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>
                    <PageHeader
                        title="Add Student"
                        showBack
                    />
                </View>

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
