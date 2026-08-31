import { Pressable, Text, View } from "react-native";

// Navy accent (Stitch "Academic Transit Logistics") — this card is rendered
// directly on the Class Students tab (and reused by Coordinator Students),
// both of which use this theme now.
const T = {
    navy: "#1a2b48",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
    success: "#2d7a4d",
    successLight: "#e3f3e9",
    danger: "#e53e3e",
    dangerLight: "#fdeaea",
} as const;

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
                    backgroundColor: "#ffffff",
                    padding: 16,
                    borderWidth: 1,
                    borderColor: T.outline,
                    opacity: pressed ? 0.75 : 1,
                },
            ])}
        >
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                        numberOfLines={1}
                        style={{ fontSize: 16, fontWeight: "700", color: T.onSurface }}
                    >
                        {student.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 2 }}>
                        #{student.admission_no}
                    </Text>
                </View>

                {/* Current-month status badge */}
                <View
                    style={{
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        backgroundColor: isPaid ? T.successLight : T.dangerLight,
                        borderWidth: 1,
                        borderColor: isPaid ? T.success : T.danger,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: isPaid ? T.success : T.danger,
                        }}
                    >
                        {label}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 0.75 }}>
                    <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Grade</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: T.onSurfaceVariant, marginTop: 1 }}>
                        {gradeName}
                    </Text>
                </View>
                <View style={{ flex: 0.75 }}>
                    <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Division</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: T.onSurfaceVariant, marginTop: 1 }}>
                        {divisionName}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Monthly Fee</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: T.navy, marginTop: 1 }}>
                        ₹{monthlyFee}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
