import { Pressable, Text, View } from "react-native";
import { Colors, Shadows } from "../../constants/colors";
import { calculateFeeBalance } from "../../utils/fee";

interface Props {
    student: any;
    onPress: () => void;
}

export default function StudentCard({ student, onPress }: Props) {
    const monthlyFee = student?.student_fee_assignments?.[0]?.monthly_fee || 0;
    const transactions = student?.fee_transactions || [];
    const summary = calculateFeeBalance({
        monthlyFee,
        transactions,
        joinDate: student.created_at,
    });
    const isDue = summary.dueAmount > 0;

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
            {/* Top row — name + status badge */}
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
                <View
                    style={{
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        backgroundColor: isDue ? Colors.dangerLight : Colors.successLight,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: isDue ? Colors.danger : Colors.success,
                        }}
                    >
                        {isDue ? `₹${summary.dueAmount} Due` : "Paid ✓"}
                    </Text>
                </View>
            </View>

            {/* Bottom row — meta info */}
            <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Parent</Text>
                    <Text
                        numberOfLines={1}
                        style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 1 }}
                    >
                        {student.parent_name || "—"}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Class</Text>
                    <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 1 }}>
                        {student.class_name || "—"}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Monthly Fee</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.primary, marginTop: 1 }}>
                        ₹{monthlyFee}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}