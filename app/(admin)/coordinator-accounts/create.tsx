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
import { Colors, Shadows } from "@/constants/colors";
import { createCoordinator } from "@/services/account.service";
import { getGrades } from "@/services/grade.service";

// ── Section Card ─────────────────────────────────────────────────────
function SectionCard({
    title,
    icon,
    children,
    zIndex,
}: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    children: React.ReactNode;
    /** Bumps stacking order above sibling cards below it — needed when this
     *  card holds an AppSelect, since on Android a sibling card's own
     *  `elevation` (from Shadows.card) otherwise wins over the dropdown's
     *  zIndex and paints on top of it. */
    zIndex?: number;
}) {
    return (
        <View style={{ marginBottom: 20, zIndex, elevation: zIndex }}>
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
        <ScreenWrapper>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={40}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}
            >
                <PageHeader
                    title="Add Coordinator"
                    subtitle="Create a coordinator account for a grade"
                    showBack
                />

                <SectionCard title="Coordinator Information" icon="analytics-outline" zIndex={10}>
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
                </SectionCard>

                <SectionCard title="Login Password" icon="key-outline">
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
                    <PasswordField
                        label="Confirm Password"
                        required
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Re-enter password"
                        error={errors.confirmPassword}
                        editable={!submitting}
                        visible={showPassword}
                    />
                </SectionCard>

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        borderRadius: 12,
                        backgroundColor: Colors.primaryLight,
                        borderWidth: 1,
                        borderColor: Colors.primaryBorder,
                        padding: 14,
                        marginBottom: 24,
                    }}
                >
                    <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={Colors.primary}
                        style={{ marginRight: 10, marginTop: 1 }}
                    />
                    <Text style={{ flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 }}>
                        The login email is generated automatically from the grade. Each grade can have only one coordinator.
                    </Text>
                </View>

                <AppButton
                    label="Create Coordinator"
                    onPress={handleCreate}
                    loading={submitting}
                    disabled={submitting}
                    fullWidth
                    iconLeft="person-add-outline"
                />
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}
