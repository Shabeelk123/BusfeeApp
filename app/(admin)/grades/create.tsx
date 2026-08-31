import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { createGrade } from "@/services/grade.service";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background:  "#f7fafc",
    navy:        "#1a2b48",
    navyLight:   "#e8ebf2",
    onSurface:   "#181c1e",
    onSurfaceVariant: "#44474d",
    outline:     "#e2e8f0",
    success:     "#2d7a4d",
    successLight:"#e3f3e9",
    warning:     "#b7791f",
    warningLight:"#fdf3e0",
} as const;

const DIVISION_LETTERS = "ABCDEFGHIJKLMNOPQ".split(""); // A–Q, matches schema comment

interface CreatedAccount {
    class: string;
    email: string;
    password: string;
}

// ── Credential Row ───────────────────────────────────────────────────
function CredentialRow({ account }: { account: CreatedAccount }) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: T.outline,
            }}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: T.successLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Text style={{ fontSize: 13, fontWeight: "800", color: T.success }}>
                    {account.class}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: T.onSurface }}>
                    {account.email}
                </Text>
                <Text style={{ fontSize: 13, color: T.onSurfaceVariant, marginTop: 2 }}>
                    {account.password}
                </Text>
            </View>
        </View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────
export default function CreateGradeScreen() {
    const toast = useToast();

    const [gradeName, setGradeName] = useState("");
    const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [gradeNameError, setGradeNameError] = useState<string | undefined>();
    const [createdAccounts, setCreatedAccounts] = useState<CreatedAccount[] | null>(null);

    const toggleDivision = (letter: string) => {
        setSelectedDivisions((prev) =>
            prev.includes(letter) ? prev.filter((d) => d !== letter) : [...prev, letter]
        );
    };

    const validate = useCallback((): boolean => {
        if (!gradeName.trim()) {
            setGradeNameError("Grade name is required");
            return false;
        }
        setGradeNameError(undefined);
        if (selectedDivisions.length === 0) {
            toast.warning("Validation Error", "Select at least one division");
            return false;
        }
        return true;
    }, [gradeName, selectedDivisions, toast]);

    const handleCreate = useCallback(async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            const { data, error } = await createGrade({
                gradeName: gradeName.trim(),
                divisions: selectedDivisions,
            });

            if (error) {
                toast.error("Creation Failed", error.message || "Unable to create grade");
                return;
            }

            toast.success("Success", `Grade ${gradeName.trim()} created with ${selectedDivisions.length} class account(s)`);
            setCreatedAccounts(data ?? []);
        } catch (error: any) {
            toast.error("Network Error", error?.message || "Failed to create grade");
        } finally {
            setLoading(false);
        }
    }, [gradeName, selectedDivisions, validate, toast]);

    if (loading) {
        return (
            <ScreenWrapper backgroundColor={T.background}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={T.navy} />
                    <Text style={{ marginTop: 12, color: T.onSurfaceVariant, fontSize: 14 }}>
                        Creating grade and class accounts...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    // ── Success view: generated credentials ──
    if (createdAccounts) {
        return (
            <ScreenWrapper backgroundColor={T.background}>
                <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 48 }}
                >
                    <View style={{ width: "100%", maxWidth: 520, alignSelf: "center" }}>
                        <PageHeader
                            title="Grade Created"
                            subtitle={`${createdAccounts.length} class account(s) generated`}
                        />

                        <View
                            style={{
                                backgroundColor: "#ffffff",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: T.outline,
                                marginBottom: 14,
                            }}
                        >
                            {createdAccounts.map((a) => (
                                <CredentialRow key={a.email} account={a} />
                            ))}
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
                                marginBottom: 20,
                            }}
                        >
                            <Ionicons
                                name="warning-outline"
                                size={18}
                                color={T.warning}
                                style={{ marginRight: 10, marginTop: 1 }}
                            />
                            <Text style={{ flex: 1, fontSize: 12, color: T.warning, lineHeight: 18 }}>
                                Save these credentials now — passwords aren't shown again after you leave this screen.
                            </Text>
                        </View>

                        <AppButton
                            label="Done"
                            onPress={() => router.replace("/(admin)/grades")}
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
                    <PageHeader title="Add Grade" showBack />

                    {/* One flat card — grade name + division picker, no section headings */}
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
                            label="Grade Name"
                            required
                            iconName="book-outline"
                            value={gradeName}
                            onChangeText={setGradeName}
                            placeholder="e.g. 8, 9, 10"
                            autoCapitalize="none"
                            error={gradeNameError}
                            editable={!loading}
                        />

                        <Text style={{ fontSize: 13, fontWeight: "600", color: T.onSurface, marginBottom: 8, marginLeft: 2 }}>
                            Divisions<Text style={{ color: "#e53e3e" }}> *</Text>
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                            {DIVISION_LETTERS.map((letter) => {
                                const selected = selectedDivisions.includes(letter);
                                return (
                                    <Pressable
                                        key={letter}
                                        onPress={() => toggleDivision(letter)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Toggle division ${letter}`}
                                        style={({ pressed }) => ({
                                            width: 40,
                                            height: 40,
                                            borderRadius: 11,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: selected ? T.navy : "#ffffff",
                                            borderWidth: 1.5,
                                            borderColor: selected ? T.navy : T.outline,
                                            opacity: pressed ? 0.8 : 1,
                                        })}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontWeight: "700",
                                                color: selected ? "#ffffff" : T.onSurface,
                                            }}
                                        >
                                            {letter}
                                        </Text>
                                    </Pressable>
                                );
                            })}
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
                            A class account is created per division; logins are shown after creation.
                        </Text>
                    </View>

                    <AppButton
                        label="Create Grade"
                        onPress={handleCreate}
                        loading={loading}
                        disabled={loading}
                        fullWidth
                        variant="navy"
                        iconLeft="add-circle-outline"
                    />
                </View>
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}
