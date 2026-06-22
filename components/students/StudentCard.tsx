import { Pressable, Text, View } from "react-native";

import { Colors, Shadows } from "../../constants/colors";
import { splitClassName } from "../../utils/className";

interface Props {
    student: any;
    onPress: () => void;
}

/**
 * Returns the current-month payment status for the student card badge.
 *
 * Logic:
 * - Academic year runs June → March.
 * - "Current month" = today's calendar month + year.
 * - A student is PAID for the current month if the sum of transactions
 *   for (payment_month, payment_year) == (now.month, now.year) covers
 *   their monthly fee. Shows pending amount if partial or zero.
 */
function getCurrentMonthStatus(student: any): {
    isPaid: boolean;
    pendingAmount: number;
    label: string;
} {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-based
    const currentYear = now.getFullYear();

    const monthlyFee: number =
        student?.student_fee_assignments?.[0]?.monthly_fee || 0;
    const transactions: any[] = student?.fee_transactions || [];

    // Sum payments made for the current calendar month only
    const paidThisMonth = transactions
        .filter(
            (t) =>
                t.payment_month === currentMonth &&
                t.payment_year === currentYear,
        )
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const pending = Math.max(0, monthlyFee - paidThisMonth);
    const isPaid = pending === 0 && monthlyFee > 0;

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
    const monthlyFee = student?.student_fee_assignments?.[0]?.monthly_fee || 0;
    const classParts = splitClassName(student.class_name);
    const { isPaid, label } = getCurrentMonthStatus(student);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`View ${student.full_name}`}
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
                        {student.full_name}
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
                <View style={{ flex: 1.1 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Parent</Text>
                    <Text
                        numberOfLines={1}
                        style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 1 }}
                    >
                        {student.parent_name || "-"}
                    </Text>
                </View>
                <View style={{ flex: 0.75 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Class</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 1 }}>
                        {classParts.classLevel || "-"}
                    </Text>
                </View>
                <View style={{ flex: 0.75 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Division</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 1 }}>
                        {classParts.division || "-"}
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
