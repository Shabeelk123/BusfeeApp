import { Pressable, Text, View } from "react-native";

import { Colors, Shadows } from "../../constants/colors";

interface Props {
    student: any;
    onPress: () => void;
}

/**
 * Returns the current-month payment status for the student card badge.
 * V2: reads from student_monthly_fees array joined on the student.
 */
function getCurrentMonthStatus(student: any): {
    isPaid: boolean;
    pendingAmount: number;
    label: string;
} {
    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();

    const monthlyFee: number = student?.monthly_fee || 0;

    // V2: look for a student_monthly_fees record for this month
    const feeRecord = (student?.student_monthly_fees ?? []).find(
        (r: any) => r.month === currentMonth && r.year === currentYear
    );

    const paidAmount: number = feeRecord?.paid_amount ?? 0;
    const status: string     = feeRecord?.status ?? "Pending";

    const isPaid    = status === "Paid";
    const pending   = Math.max(0, monthlyFee - paidAmount);

    return {
        isPaid,
        pendingAmount: pending,
        label: isPaid
            ? "Paid"
            : monthlyFee === 0
              ? "No Fee"
              : `₹${pending} Due`,
    };
}

export default function StudentCard({ student, onPress }: Props) {
    const monthlyFee = student?.monthly_fee || 0;

    // V2: grade and division come from joined relations
    const gradeName    = student?.grade?.name    ?? "-";
    const divisionName = student?.division?.name ?? "-";

    const { isPaid, label } = getCurrentMonthStatus(student);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`View ${student.name}`}
            style={({ pressed }) => ([
                {
                    marginBottom: 12,
                    borderRadius: 16,
                    backgroundColor: Colors.card,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    opacity: pressed ? 0.75 : 1,
                },
                Shadows.card,
            ])}
        >
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                        numberOfLines={1}
                        style={{ fontSize: 16, fontWeight: "700", color: Colors.textPrimary }}
                    >
                        {student.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                        #{student.admission_no}
                    </Text>
                </View>

                {/* Current-month status badge */}
                <View
                    style={{
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        backgroundColor: isPaid ? Colors.successLight : Colors.dangerLight,
                        borderWidth: 1,
                        borderColor: isPaid ? Colors.successBorder : Colors.dangerBorder,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: isPaid ? Colors.success : Colors.danger,
                        }}
                    >
                        {label}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 0.75 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Grade</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 1 }}>
                        {gradeName}
                    </Text>
                </View>
                <View style={{ flex: 0.75 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Division</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 1 }}>
                        {divisionName}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Monthly Fee</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: Colors.primary, marginTop: 1 }}>
                        ₹{monthlyFee}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
