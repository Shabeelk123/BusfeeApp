import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Colors, Shadows } from "../../constants/colors";
import { getDivisionOptions, getGradeOptions } from "../../services/class.service";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect, { DropdownOption } from "../common/AppSelect";
import { useToast } from "../common/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentFormValues {
    name: string;
    admissionNo: string;
    gradeId: string;
    divisionId: string;
    monthlyFee: number;
}

interface Props {
    mode: "create" | "edit";
    initialValues?: Partial<{
        name: string;
        admissionNo: string;
        gradeId: string;
        divisionId: string;
        monthlyFee: string;
    }>;
    submitLabel: string;
    onSubmit: (values: StudentFormValues) => Promise<{ error?: any }>;
    onSuccess: () => void;
}

interface FormErrors {
    name?: string;
    admissionNo?: string;
    gradeId?: string;
    divisionId?: string;
    monthlyFee?: string;
}

// ─── Section Card ─────────────────────────────────────────────────────────────

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

// ─── Shared Student Form ────────────────────────────────────────────────────────
// Used by both app/(admin)/students/create.tsx and edit.tsx — real V2 fields
// only (students table: admission_no, name, grade_id, division_id, monthly_fee).
// Login credentials are never entered here — student.service.ts::createStudent
// generates them automatically from name + admission number.

export default function StudentForm({ mode, initialValues, submitLabel, onSubmit, onSuccess }: Props) {
    const toast = useToast();

    const [name, setName] = useState(initialValues?.name ?? "");
    const [admissionNo, setAdmissionNo] = useState(initialValues?.admissionNo ?? "");
    const [gradeId, setGradeId] = useState(initialValues?.gradeId ?? "");
    const [divisionId, setDivisionId] = useState(initialValues?.divisionId ?? "");
    const [monthlyFee, setMonthlyFee] = useState(initialValues?.monthlyFee ?? "");

    const [gradeOptions, setGradeOptions] = useState<DropdownOption[]>([]);
    const [divisionOptions, setDivisionOptions] = useState<DropdownOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // ── Load grade options once ──
    useEffect(() => {
        (async () => {
            const { data } = await getGradeOptions();
            setGradeOptions(data.map((g) => ({ label: g.name, value: g.id })));
        })();
    }, []);

    // ── Load division options whenever the selected grade changes ──
    useEffect(() => {
        (async () => {
            if (!gradeId) { setDivisionOptions([]); return; }
            const { data } = await getDivisionOptions(gradeId);
            setDivisionOptions(data.map((d) => ({ label: d.name, value: d.id })));
        })();
    }, [gradeId]);

    // ── Validation ──
    const validate = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        if (!name.trim()) newErrors.name = "Name is required";
        if (!admissionNo.trim()) newErrors.admissionNo = "Admission number is required";
        if (!gradeId) newErrors.gradeId = "Select a grade";
        if (!divisionId) newErrors.divisionId = "Select a division";

        if (!monthlyFee.trim()) {
            newErrors.monthlyFee = "Monthly fee is required";
        } else if (isNaN(Number(monthlyFee)) || Number(monthlyFee) <= 0) {
            newErrors.monthlyFee = "Enter a valid amount";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [name, admissionNo, gradeId, divisionId, monthlyFee]);

    // ── Submit ──
    const handleSubmit = useCallback(async () => {
        if (!validate()) {
            toast.warning("Validation Error", "Please check all required fields");
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await onSubmit({
                name: name.trim(),
                admissionNo: admissionNo.trim(),
                gradeId,
                divisionId,
                monthlyFee: Number(monthlyFee),
            });

            if (error) {
                if (error.message?.includes("already exists")) {
                    setErrors({ admissionNo: "This admission number already exists" });
                    toast.error("Save Failed", error.message);
                } else {
                    toast.error("Save Failed", error.message || "Unable to save student");
                }
                return;
            }

            onSuccess();
        } catch (error: any) {
            toast.error("Network Error", error?.message || "Failed to save student");
        } finally {
            setSubmitting(false);
        }
    }, [validate, onSubmit, onSuccess, name, admissionNo, gradeId, divisionId, monthlyFee, toast]);

    return (
        <>
            <SectionCard title="Student Information" icon="person-outline">
                <AppInput
                    label="Name"
                    required
                    iconName="person-outline"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Rahul Kumar"
                    autoCapitalize="words"
                    error={errors.name}
                    editable={!submitting}
                />
                <AppInput
                    label="Admission Number"
                    required
                    iconName="id-card-outline"
                    value={admissionNo}
                    onChangeText={setAdmissionNo}
                    placeholder="e.g. ADM-2026-001"
                    autoCapitalize="characters"
                    error={errors.admissionNo}
                    editable={!submitting}
                />
            </SectionCard>

            <SectionCard title="School Details" icon="school-outline">
                <AppSelect
                    label="Grade"
                    value={gradeId}
                    options={gradeOptions}
                    placeholder="Select grade"
                    onChange={(v) => { setGradeId(String(v)); setDivisionId(""); }}
                />
                {errors.gradeId && (
                    <Text style={{ fontSize: 12, color: Colors.danger, marginTop: -12, marginBottom: 12, marginLeft: 2 }}>
                        {errors.gradeId}
                    </Text>
                )}

                <AppSelect
                    label="Division"
                    value={divisionId}
                    options={divisionOptions}
                    placeholder={gradeId ? "Select division" : "Select a grade first"}
                    onChange={(v) => setDivisionId(String(v))}
                />
                {errors.divisionId && (
                    <Text style={{ fontSize: 12, color: Colors.danger, marginTop: -12, marginBottom: 12, marginLeft: 2 }}>
                        {errors.divisionId}
                    </Text>
                )}

                <AppInput
                    label="Monthly Fee (₹)"
                    required
                    iconName="cash-outline"
                    value={monthlyFee}
                    onChangeText={setMonthlyFee}
                    placeholder="e.g. 1200"
                    keyboardType="decimal-pad"
                    error={errors.monthlyFee}
                    editable={!submitting}
                />
            </SectionCard>

            {mode === "create" && (
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        borderRadius: 12,
                        backgroundColor: Colors.primaryLight,
                        borderWidth: 1,
                        borderColor: Colors.primaryBorder,
                        padding: 14,
                        marginBottom: 20,
                    }}
                >
                    <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={Colors.primary}
                        style={{ marginRight: 10, marginTop: 1 }}
                    />
                    <Text style={{ flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 }}>
                        A login is generated automatically from the student&apos;s name and admission number. It will be shown after the profile is created.
                    </Text>
                </View>
            )}

            <AppButton
                label={submitLabel}
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                fullWidth
                iconLeft={mode === "create" ? "person-add-outline" : "checkmark-outline"}
            />
        </>
    );
}
