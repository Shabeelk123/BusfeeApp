import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { getDivisionOptions, getGradeOptions } from "../../services/class.service";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect, { DropdownOption } from "../common/AppSelect";
import { useToast } from "../common/ToastContext";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    navy:        "#1a2b48",
    navyLight:   "#e8ebf2",
    outline:     "#e2e8f0",
} as const;

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

// ─── Shared Student Form ────────────────────────────────────────────────────────
// Used by both app/(admin)/students/create.tsx and edit.tsx — real V2 fields
// only (students table: admission_no, name, grade_id, division_id, monthly_fee).
// Login credentials are never entered here — student.service.ts::createStudent
// generates them automatically from name + admission number.
//
// One flat card, no section headings — the field labels already say what
// each one is, and short fields (admission no / fee, grade / division) sit
// two-to-a-row so the whole form fits on one screen without scrolling.

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
        <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>
            <View
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    padding: 16,
                    paddingBottom: 4,
                    borderWidth: 1,
                    borderColor: T.outline,
                    marginBottom: 14,
                }}
            >
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

                <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                        <AppInput
                            label="Admission No."
                            required
                            iconName="id-card-outline"
                            value={admissionNo}
                            onChangeText={setAdmissionNo}
                            placeholder="ADM-2026-001"
                            autoCapitalize="characters"
                            error={errors.admissionNo}
                            editable={!submitting}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
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
                    </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                        <AppSelect
                            label="Grade"
                            required
                            iconName="school-outline"
                            value={gradeId}
                            options={gradeOptions}
                            placeholder="Select"
                            searchable={false}
                            error={errors.gradeId}
                            disabled={submitting}
                            onChange={(v) => { setGradeId(String(v)); setDivisionId(""); }}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppSelect
                            label="Division"
                            required
                            iconName="grid-outline"
                            value={divisionId}
                            options={divisionOptions}
                            placeholder={gradeId ? "Select" : "Grade first"}
                            searchable
                            error={errors.divisionId}
                            disabled={submitting || !gradeId}
                            onChange={(v) => setDivisionId(String(v))}
                        />
                    </View>
                </View>
            </View>

            {mode === "create" && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, paddingHorizontal: 2 }}>
                    <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color={T.navy}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={{ flex: 1, fontSize: 11.5, color: T.navy, lineHeight: 15 }}>
                        Login is generated automatically and shown after creation.
                    </Text>
                </View>
            )}

            <AppButton
                label={submitLabel}
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                fullWidth
                variant="navy"
                iconLeft={mode === "create" ? "person-add-outline" : "checkmark-outline"}
            />
        </View>
    );
}
