import { ActivityIndicator, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { Colors, Shadows } from "@/constants/colors";
import { getStudentById, updateStudent } from "@/services/student.service";
import { composeClassName, splitClassName } from "@/utils/className";
import { Ionicons } from "@expo/vector-icons";

// ── Section Card ─────────────────────────────────────────────────────
function SectionCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    children: React.ReactNode;
}) {
    return (
        <View style={{ marginBottom: 20 }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                }}
            >
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
                    <Ionicons name={icon} size={15} color={Colors.primary} />
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
                    {title}
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
                {children}
            </View>
        </View>
    );
}

export default function EditStudentScreen() {
    const toast = useToast();
    const { id } = useLocalSearchParams();
    const [student, setStudent] = useState<any>(null);
    const [fullName, setFullName] = useState("");
    const [parentName, setParentName] = useState("");
    const [phone, setPhone] = useState("");
    const [classLevel, setClassLevel] = useState("");
    const [division, setDivision] = useState("");
    const [busRoute, setBusRoute] = useState("");
    const [monthlyFee, setMonthlyFee] = useState("");
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchStudent = useCallback(async () => {
        setPageLoading(true);
        const { data } = await getStudentById(id as string);
        if (data) {
            setStudent(data);
            setFullName(data.full_name ?? "");
            setParentName(data.parent_name ?? "");
            setPhone(data.phone ?? "");
            const classParts = splitClassName(data.class_name);
            setClassLevel(classParts.classLevel);
            setDivision(classParts.division);
            setBusRoute(data.bus_route ?? "");
            setMonthlyFee(String(data?.student_fee_assignments?.[0]?.monthly_fee || ""));
        }
        setPageLoading(false);
    }, [id]);

    useEffect(() => { fetchStudent(); }, [fetchStudent]);

    const handleUpdate = async () => {
        if (!student) return;
        try {
            setSaving(true);
            const feeAssignment = student?.student_fee_assignments?.[0];
            const { error } = await updateStudent({
                studentId: student.id,
                feeAssignmentId: feeAssignment?.id,
                studentData: {
                    full_name: fullName,
                    parent_name: parentName,
                    phone,
                    class_name: composeClassName(classLevel, division),
                    bus_route: busRoute,
                },
                monthlyFee: Number(monthlyFee),
            });
            if (error) { toast.error("Update Failed", error.message); return; }
            toast.success("Student Updated", "Student record has been saved.");
            router.back();
        } catch {
            toast.error("Network Error", "Failed to update. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (pageLoading) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 13 }}>
                        Loading student…
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={30}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}
            >
                <PageHeader
                    title="Edit Student"
                    subtitle="Update the student's details"
                    showBack
                />

                <SectionCard title="Personal Information" icon="person-outline">
                    <AppInput
                        label="Full Name"
                        required
                        iconName="person-outline"
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="e.g. Rahul Kumar"
                        autoCapitalize="words"
                    />
                    <AppInput
                        label="Parent Name"
                        iconName="people-outline"
                        value={parentName}
                        onChangeText={setParentName}
                        placeholder="e.g. Raj Kumar"
                        autoCapitalize="words"
                    />
                    <AppInput
                        label="Phone Number"
                        iconName="call-outline"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="e.g. 9876543210"
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                    />
                </SectionCard>

                <SectionCard title="School Details" icon="school-outline">
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="Class"
                                iconName="book-outline"
                                value={classLevel}
                                onChangeText={setClassLevel}
                                placeholder="e.g. 10"
                                autoCapitalize="characters"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="Division"
                                iconName="grid-outline"
                                value={division}
                                onChangeText={setDivision}
                                placeholder="e.g. A"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>
                    <AppInput
                        label="Bus Route"
                        iconName="bus-outline"
                        value={busRoute}
                        onChangeText={setBusRoute}
                        placeholder="e.g. Route 3 – Sector 7"
                    />
                    <AppInput
                        label="Monthly Fee (₹)"
                        required
                        iconName="cash-outline"
                        value={monthlyFee}
                        onChangeText={setMonthlyFee}
                        placeholder="e.g. 1200"
                        keyboardType="numeric"
                        autoCapitalize="none"
                    />
                </SectionCard>

                <AppButton
                    label="Save Changes"
                    onPress={handleUpdate}
                    loading={saving}
                    disabled={saving}
                    fullWidth
                    iconLeft="checkmark-outline"
                />
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}
