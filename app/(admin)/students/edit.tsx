import { ActivityIndicator, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import StudentForm from "@/components/students/StudentForm";
import { Colors } from "@/constants/colors";
import { getStudentById, updateStudent } from "@/services/student.service";

export default function EditStudentScreen() {
    const toast = useToast();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [initialValues, setInitialValues] = useState<{
        name: string;
        admissionNo: string;
        gradeId: string;
        divisionId: string;
        monthlyFee: string;
    } | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    const fetchStudent = useCallback(async () => {
        setPageLoading(true);
        const { data } = await getStudentById(id);
        if (data) {
            setInitialValues({
                name: data.name ?? "",
                admissionNo: data.admission_no ?? "",
                gradeId: data.grade_id ?? "",
                divisionId: data.division_id ?? "",
                monthlyFee: String(data.monthly_fee ?? ""),
            });
        }
        setPageLoading(false);
    }, [id]);

    useEffect(() => { fetchStudent(); }, [fetchStudent]);

    if (pageLoading || !initialValues) {
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

                <StudentForm
                    mode="edit"
                    initialValues={initialValues}
                    submitLabel="Save Changes"
                    onSubmit={(values) =>
                        updateStudent(id, {
                            name: values.name,
                            admission_no: values.admissionNo,
                            grade_id: values.gradeId,
                            division_id: values.divisionId,
                            monthly_fee: values.monthlyFee,
                        })
                    }
                    onSuccess={() => {
                        toast.success("Student Updated", "Student record has been saved.");
                        router.back();
                    }}
                />
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}
