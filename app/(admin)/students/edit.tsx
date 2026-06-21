import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../../components/common/ToastContext";
import AppButton from "../../../components/common/AppButton";
import AppInput from "../../../components/common/AppInput";
import PageHeader from "../../../components/common/PageHeader";
import { Colors, Shadows } from "../../../constants/colors";
import { getStudentById, updateStudent } from "../../../services/student.service";

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

export default function EditStudentScreen() {
    const toast = useToast();
    const { id } = useLocalSearchParams();
    const [student, setStudent] = useState<any>(null);
    const [fullName, setFullName] = useState("");
    const [parentName, setParentName] = useState("");
    const [phone, setPhone] = useState("");
    const [className, setClassName] = useState("");
    const [busRoute, setBusRoute] = useState("");
    const [monthlyFee, setMonthlyFee] = useState("");
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchStudent = async () => {
        setPageLoading(true);
        const { data } = await getStudentById(id as string);
        if (data) {
            setStudent(data);
            setFullName(data.full_name ?? "");
            setParentName(data.parent_name ?? "");
            setPhone(data.phone ?? "");
            setClassName(data.class_name ?? "");
            setBusRoute(data.bus_route ?? "");
            setMonthlyFee(String(data?.student_fee_assignments?.[0]?.monthly_fee || ""));
        }
        setPageLoading(false);
    };

    useEffect(() => { fetchStudent(); }, []);

    const handleUpdate = async () => {
        if (!student) return;
        try {
            setSaving(true);
            const feeAssignment = student?.student_fee_assignments?.[0];
            const { error } = await updateStudent({
                studentId: student.id,
                feeAssignmentId: feeAssignment?.id,
                studentData: { full_name: fullName, parent_name: parentName, phone, class_name: className, bus_route: busRoute },
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
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 13 }}>Loading student…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={30}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
            >
                <PageHeader title="Edit Student" subtitle="Update the student's details" showBack />

                <SectionCard title="Personal Information">
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

                <SectionCard title="School Details">
                    <AppInput
                        label="Class"
                        iconName="book-outline"
                        value={className}
                        onChangeText={setClassName}
                        placeholder="e.g. 10-A"
                        autoCapitalize="characters"
                    />
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
        </SafeAreaView>
    );
}