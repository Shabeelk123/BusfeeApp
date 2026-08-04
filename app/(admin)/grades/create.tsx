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
import { Colors, Shadows } from "@/constants/colors";
import { createGrade } from "@/services/grade.service";

const DIVISION_LETTERS = "ABCDEFGHIJKLMNOPQ".split(""); // A–Q, matches schema comment

interface CreatedAccount {
    class: string;
    email: string;
    password: string;
}

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

// ── Credential Row ───────────────────────────────────────────────────
function CredentialRow({ account }: { account: CreatedAccount }) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: Colors.cardBorderLight,
            }}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: Colors.successLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.success }}>
                    {account.class}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.textPrimary }}>
                    {account.email}
                </Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
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
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 14 }}>
                        Creating grade and class accounts...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    // ── Success view: generated credentials ──
    if (createdAccounts) {
        return (
            <ScreenWrapper>
                <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 48 }}
                >
                    <PageHeader
                        title="Grade Created"
                        subtitle={`${createdAccounts.length} class account(s) generated`}
                    />

                    <SectionCard title="Class Account Credentials" icon="key-outline">
                        {createdAccounts.map((a) => (
                            <CredentialRow key={a.email} account={a} />
                        ))}
                    </SectionCard>

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
                            Save these credentials now — passwords aren't shown again after you leave this screen.
                        </Text>
                    </View>

                    <AppButton
                        label="Done"
                        onPress={() => router.replace("/(admin)/grades")}
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
                contentContainerStyle={{ paddingBottom: 48 }}
            >
                <PageHeader
                    title="Add Grade"
                    subtitle="Create a grade and its class accounts"
                    showBack
                />

                <SectionCard title="Grade Information" icon="school-outline">
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
                </SectionCard>

                <SectionCard title="Divisions" icon="grid-outline">
                    <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 12 }}>
                        Select one or more divisions. A class account is created for each.
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {DIVISION_LETTERS.map((letter) => {
                            const selected = selectedDivisions.includes(letter);
                            return (
                                <Pressable
                                    key={letter}
                                    onPress={() => toggleDivision(letter)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Toggle division ${letter}`}
                                    style={({ pressed }) => ({
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: selected ? Colors.primary : Colors.inputBg,
                                        borderWidth: 1.5,
                                        borderColor: selected ? Colors.primary : Colors.inputBorder,
                                        opacity: pressed ? 0.8 : 1,
                                    })}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            color: selected ? Colors.textOnDark : Colors.textPrimary,
                                        }}
                                    >
                                        {letter}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
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
                        Each division gets its own class account, with login credentials shown after creation.
                    </Text>
                </View>

                <AppButton
                    label="Create Grade"
                    onPress={handleCreate}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    iconLeft="add-circle-outline"
                />
            </KeyboardAwareScrollView>
        </ScreenWrapper>
    );
}
