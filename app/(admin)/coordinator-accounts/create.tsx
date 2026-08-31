import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import PasswordField from "@/components/accounts/PasswordField";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import AppSelect, { DropdownOption } from "@/components/common/AppSelect";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { createCoordinator } from "@/services/account.service";
import { getGrades } from "@/services/grade.service";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background:  "#f7fafc",
    navy:        "#1a2b48",
    outline:     "#e2e8f0",
} as const;

interface FormErrors {
    gradeId?: string;
    coordinatorName?: string;
    password?: string;
    confirmPassword?: string;
}

// ── Screen ────────────────────────────────────────────────────────────
export default function CreateCoordinatorScreen() {
    const toast = useToast();

    const [gradeId, setGradeId] = useState("");
    const [coordinatorName, setCoordinatorName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [gradeOptions, setGradeOptions] = useState<DropdownOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        (async () => {
            const { data } = await getGrades();
            setGradeOptions(data.map((g) => ({ label: `Grade ${g.name}`, value: g.id })));
        })();
    }, []);

    const validate = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        if (!gradeId) newErrors.gradeId = "Select a grade";
        if (!coordinatorName.trim()) newErrors.coordinatorName = "Coordinator name is required";

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Must be at least 8 characters";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Confirm the password";
        } else if (password && confirmPassword !== password) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [gradeId, coordinatorName, password, confirmPassword]);

    const handleCreate = useCallback(async () => {
        if (!validate()) {
            toast.warning("Validation Error", "Please check all required fields");
            return;
        }

        try {
            setSubmitting(true);
            const { data, error } = await createCoordinator({
                gradeId,
                coordinatorName: coordinatorName.trim(),
                password,
            });

            if (error) {
                if (error.message?.includes("already has a coordinator")) {
                    setErrors({ gradeId: error.message });
                }
                toast.error("Creation Failed", error.message || "Unable to create coordinator");
                return;
            }

            toast.success("Success", `Coordinator created${data?.email ? ` — ${data.email}` : ""}`);
            router.replace("/(admin)/coordinator-accounts");
        } catch (error: any) {
            toast.error("Network Error", error?.message || "Failed to create coordinator");
        } finally {
            setSubmitting(false);
        }
    }, [gradeId, coordinatorName, password, validate, toast]);

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
                    <PageHeader title="Add Coordinator" showBack />

                    {/* One flat card — grade, name and password, no section headings */}
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
                        <AppSelect
                            label="Grade"
                            required
                            iconName="school-outline"
                            value={gradeId}
                            options={gradeOptions}
                            placeholder="Select grade"
                            searchable={false}
                            error={errors.gradeId}
                            disabled={submitting}
                            onChange={(v) => setGradeId(String(v))}
                        />

                        <AppInput
                            label="Coordinator Name"
                            required
                            iconName="person-outline"
                            value={coordinatorName}
                            onChangeText={setCoordinatorName}
                            placeholder="e.g. Anitha Menon"
                            autoCapitalize="words"
                            error={errors.coordinatorName}
                            editable={!submitting}
                        />

                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <PasswordField
                                    label="Password"
                                    required
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Min. 8 characters"
                                    error={errors.password}
                                    editable={!submitting}
                                    visible={showPassword}
                                    onToggleVisible={() => setShowPassword((v) => !v)}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <PasswordField
                                    label="Confirm"
                                    required
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Re-enter"
                                    error={errors.confirmPassword}
                                    editable={!submitting}
                                    visible={showPassword}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, paddingHorizontal: 2 }}>
                        <Ionicons
                            name="information-circle-outline"
                            size={14}
                            color={T.navy}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={{ flex: 1, fontSize: 11.5, color: T.navy, lineHeight: 15 }}>
                            Login email is generated from the grade — one coordinator per grade.
                        </Text>
                    </View>

                    <AppButton
                        label="Create Coordinator"
                        onPress={handleCreate}
                        loading={submitting}
                        disabled={submitting}
                        fullWidth
                        variant="navy"
                        iconLeft="person-add-outline"
                    />
                </View>
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}
