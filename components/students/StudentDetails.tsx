import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import { Colors, Shadows } from "../../constants/colors";
import { deleteStudent, getStudentById } from "../../services/student.service";
import { splitClassName } from "../../utils/className";
import { calculateFeeBalance } from "../../utils/fee";
import { generateMonthlyFeeStatus } from "../../utils/monthlyFeeStatus";
import AppButton from "../common/AppButton";
import ConfirmDialog from "../common/ConfirmDialog";
import PageHeader from "../common/PageHeader";
import ScreenWrapper from "../common/ScreenWrapper";
import { useToast } from "../common/ToastContext";

interface Props {
    role: "ADMIN" | "TEACHER";
    baseRoute: "/(admin)" | "/(teacher)";
}

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function SummaryCard({
    label,
    value,
    tone = "primary",
}: {
    label: string;
    value: string;
    tone?: "primary" | "success" | "danger";
}) {
    const toneColor =
        tone === "success" ? Colors.success : tone === "danger" ? Colors.danger : Colors.primary;
    const toneBg =
        tone === "success" ? Colors.successLight : tone === "danger" ? Colors.dangerLight : Colors.primaryLight;

    return (
        <View
            style={[
                {
                    flex: 1,
                    borderRadius: 16,
                    backgroundColor: Colors.card,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    padding: 14,
                    minHeight: 82,
                },
                Shadows.card,
            ]}
        >
            <View
                style={{
                    alignSelf: "flex-start",
                    borderRadius: 999,
                    backgroundColor: toneBg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginBottom: 8,
                }}
            >
                <Text style={{ color: toneColor, fontSize: 10, fontWeight: "700" }}>{label}</Text>
            </View>
            <Text numberOfLines={1} style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "800" }}>
                {value}
            </Text>
        </View>
    );
}

function InfoRow({
    icon,
    label,
    value,
    isLast,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string | number | null;
    isLast?: boolean;
}) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 13,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: Colors.cardBorderLight,
            }}
        >
            <View
                style={{
                    height: 36,
                    width: 36,
                    borderRadius: 12,
                    backgroundColor: Colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Ionicons name={icon} size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: "600" }}>{label}</Text>
                <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: "600", marginTop: 2 }}>
                    {value || "-"}
                </Text>
            </View>
        </View>
    );
}

export default function StudentDetailsScreen({ role, baseRoute }: Props) {
    const toast = useToast();
    const { id } = useLocalSearchParams();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"info" | "monthly" | "transactions">("info");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const fetchStudent = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await getStudentById(id as string);
            if (data) setStudent(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(useCallback(() => { fetchStudent(); }, [fetchStudent]));

    const handleDelete = async () => {
        const { error } = await deleteStudent(student.id);
        if (error) {
            toast.error("Delete Failed", error.message);
            return;
        }
        router.back();
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: 14 }}>
                        Loading profile...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!student) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="alert-circle-outline" size={44} color={Colors.textMuted} />
                    <Text style={{ marginTop: 14, fontSize: 18, fontWeight: "700", color: Colors.textPrimary }}>
                        Student not found
                    </Text>
                    <View style={{ marginTop: 16 }}>
                        <AppButton label="Go Back" variant="secondary" onPress={() => router.back()} />
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    const monthlyFee = student?.student_fee_assignments?.[0]?.monthly_fee || 0;
    const feeSummary = calculateFeeBalance({
        monthlyFee,
        transactions: student?.fee_transactions || [],
        joinDate: student.created_at,
    });
    const monthlyStatus = generateMonthlyFeeStatus({
        monthlyFee,
        joinDate: student.created_at,
        transactions: student?.fee_transactions || [],
    });
    const classParts = splitClassName(student.class_name);
    const displayClass = classParts.classLevel;
    const dueTone = feeSummary.dueAmount > 0 ? "danger" : "success";

    return (
        <ScreenWrapper>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
            >
                <PageHeader
                    title={student.full_name}
                    subtitle={`Admission #${student.admission_no}`}
                    showBack
                />

                <View
                    style={[
                        {
                            borderRadius: 18,
                            backgroundColor: Colors.card,
                            borderWidth: 1,
                            borderColor: Colors.cardBorderLight,
                            padding: 18,
                            marginBottom: 16,
                        },
                        Shadows.card,
                    ]}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                height: 58,
                                width: 58,
                                borderRadius: 18,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: Colors.primaryLight,
                                marginRight: 14,
                            }}
                        >
                            <Ionicons name="school-outline" size={28} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: "700" }}>
                                Student Profile
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 2 }}
                            >
                                {student.full_name}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                        <View
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                backgroundColor: Colors.inputBg,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                            }}
                        >
                            <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Class</Text>
                            <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                                {classParts.classLevel || "-"}
                            </Text>
                        </View>
                        <View
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                backgroundColor: Colors.inputBg,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                            }}
                        >
                            <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Division</Text>
                            <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                                {classParts.division || "-"}
                            </Text>
                        </View>
                        <View
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                backgroundColor: Colors.inputBg,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                            }}
                        >
                            <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Route</Text>
                            <Text numberOfLines={1} style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: "700", marginTop: 2 }}>
                                {student.bus_route || "-"}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                    <SummaryCard label="Monthly" value={`Rs ${monthlyFee}`} />
                    <SummaryCard label="Paid" value={`Rs ${feeSummary.totalPaid}`} tone="success" />
                    <SummaryCard
                        label={feeSummary.dueAmount > 0 ? "Due" : "Advance"}
                        value={`Rs ${feeSummary.dueAmount > 0 ? feeSummary.dueAmount : feeSummary.advanceAmount}`}
                        tone={dueTone}
                    />
                </View>

                <AppButton
                    label="Add Payment"
                    iconLeft="add-circle-outline"
                    fullWidth
                    onPress={() =>
                        router.push({
                            pathname: `${baseRoute}/students/add-payment` as any,
                            params: { studentId: student.id },
                        })
                    }
                />

                {role === "ADMIN" && (
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 12, marginBottom: 18 }}>
                        <View style={{ flex: 1 }}>
                            <AppButton
                                label="Edit"
                                variant="secondary"
                                iconLeft="create-outline"
                                fullWidth
                                onPress={() =>
                                    router.push({
                                        pathname: "/(admin)/students/edit",
                                        params: { id: student.id },
                                    })
                                }
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppButton
                                label="Delete"
                                variant="danger"
                                iconLeft="trash-outline"
                                fullWidth
                                onPress={() => setShowDeleteDialog(true)}
                            />
                        </View>
                    </View>
                )}

                <View
                    style={{
                        flexDirection: "row",
                        borderRadius: 14,
                        backgroundColor: Colors.card,
                        borderWidth: 1,
                        borderColor: Colors.cardBorderLight,
                        padding: 4,
                        marginTop: role === "ADMIN" ? 0 : 18,
                        marginBottom: 16,
                    }}
                >
                    {(["info", "monthly", "transactions"] as const).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <Pressable
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                accessibilityRole="button"
                                style={({ pressed }) => ({
                                    flex: 1,
                                    alignItems: "center",
                                    borderRadius: 10,
                                    paddingVertical: 10,
                                    backgroundColor: isActive ? Colors.primary : "transparent",
                                    opacity: pressed ? 0.75 : 1,
                                })}
                            >
                                <Text
                                    style={{
                                        color: isActive ? Colors.textOnDark : Colors.textSecondary,
                                        fontSize: 12,
                                        fontWeight: "800",
                                    }}
                                >
                                    {tab === "info" ? "Info" : tab === "monthly" ? "Monthly" : "Payments"}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {activeTab === "info" && (
                    <View
                        style={[
                            {
                                borderRadius: 16,
                                backgroundColor: Colors.card,
                                borderWidth: 1,
                                borderColor: Colors.cardBorderLight,
                                paddingHorizontal: 14,
                            },
                            Shadows.card,
                        ]}
                    >
                        <InfoRow icon="people-outline" label="Parent Name" value={student.parent_name} />
                        <InfoRow icon="call-outline" label="Phone" value={student.phone} />
                        <InfoRow icon="book-outline" label="Class" value={displayClass} />
                        <InfoRow icon="grid-outline" label="Division" value={classParts.division} />
                        <InfoRow icon="bus-outline" label="Bus Route" value={student.bus_route} />
                        <InfoRow icon="cash-outline" label="Expected Total" value={`Rs ${feeSummary.expectedAmount}`} />
                        <InfoRow
                            icon="calendar-outline"
                            label="Months Enrolled"
                            value={`${feeSummary.totalMonths} months`}
                            isLast
                        />
                    </View>
                )}

                {activeTab === "monthly" && (
                    <View>
                        {monthlyStatus.months.map((item, index) => {
                            const isPaid = item.status === "PAID";
                            const isPartial = item.status === "PARTIAL";
                            const color = isPaid ? Colors.success : isPartial ? Colors.warning : Colors.danger;
                            const bg = isPaid ? Colors.successLight : isPartial ? Colors.warningLight : Colors.dangerLight;
                            const border = isPaid ? Colors.successBorder : isPartial ? Colors.warningBorder : Colors.dangerBorder;

                            return (
                                <View
                                    key={index}
                                    style={{
                                        marginBottom: 10,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: border,
                                        backgroundColor: Colors.card,
                                        padding: 14,
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: "800" }}>
                                            {MONTH_NAMES[item.month - 1]} {item.year}
                                        </Text>
                                        <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 3 }}>
                                            Paid Rs {item.paid} / Rs {item.expected}
                                        </Text>
                                    </View>
                                    <View style={{ borderRadius: 999, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 5 }}>
                                        <Text style={{ color, fontSize: 11, fontWeight: "800" }}>{item.status}</Text>
                                    </View>
                                </View>
                            );
                        })}
                        {monthlyStatus.advanceAmount > 0 && (
                            <View
                                style={{
                                    borderRadius: 14,
                                    backgroundColor: Colors.primaryLight,
                                    borderWidth: 1,
                                    borderColor: Colors.primaryBorder,
                                    padding: 14,
                                }}
                            >
                                <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: "800" }}>
                                    Advance Balance: Rs {monthlyStatus.advanceAmount}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === "transactions" && (
                    <View>
                        {!student?.fee_transactions?.length ? (
                            <View style={{ alignItems: "center", paddingVertical: 48 }}>
                                <Ionicons name="card-outline" size={40} color={Colors.textMuted} />
                                <Text style={{ color: Colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                                    No transactions yet
                                </Text>
                            </View>
                        ) : (
                            student.fee_transactions.map((item: any) => (
                                <View
                                    key={item.id}
                                    style={[
                                        {
                                            marginBottom: 10,
                                            borderRadius: 14,
                                            backgroundColor: Colors.card,
                                            borderWidth: 1,
                                            borderColor: Colors.cardBorderLight,
                                            padding: 14,
                                        },
                                        Shadows.card,
                                    ]}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <Text style={{ color: Colors.success, fontSize: 18, fontWeight: "800" }}>
                                            Rs {item.amount}
                                        </Text>
                                        <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
                                            {MONTH_NAMES[(item.payment_month || 1) - 1]} {item.payment_year}
                                        </Text>
                                    </View>
                                    {item.note ? (
                                        <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                                            {item.note}
                                        </Text>
                                    ) : null}
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            <ConfirmDialog
                visible={showDeleteDialog}
                variant="danger"
                title="Delete Student"
                subtitle="This will permanently remove the student and all associated fee records. This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </ScreenWrapper>
    );
}
