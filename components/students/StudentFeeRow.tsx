import { Pressable, Text, View } from "react-native";

import { Colors, Shadows } from "../../constants/colors";
import { ReportStudentRow } from "../../services/report.service";

const STATUS_TONE: Record<string, { color: string; bg: string }> = {
    Paid:     { color: Colors.success, bg: Colors.successLight },
    Partial:  { color: Colors.warning, bg: Colors.warningLight },
    Pending:  { color: Colors.danger,  bg: Colors.dangerLight },
    Excluded: { color: Colors.textMuted, bg: Colors.cardBorderLight },
};

interface Props {
    row: ReportStudentRow;
    onPress: () => void;
}

/**
 * One table-style row: Name/Admission No, Paid, Pending, Status — for a
 * student's fee status in a given (already-fetched) academic month. Shared
 * by the CLASS dashboard and the Admin Students list so both look and
 * behave the same way.
 */
export default function StudentFeeRow({ row, onPress }: Props) {
    const pending = row.status === "Excluded" ? 0 : Math.max(0, (row.fee ?? 0) - (row.paid_amount ?? 0));
    const tone = STATUS_TONE[row.status] ?? STATUS_TONE.Pending;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.card,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    padding: 14,
                    marginBottom: 10,
                    opacity: pressed ? 0.75 : 1,
                },
                Shadows.card,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`View ${row.name}`}
        >
            <View style={{ flex: 1.4, marginRight: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>
                    {row.name}
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
                    #{row.admission_no}
                </Text>
            </View>
            <View style={{ flex: 0.9, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, color: Colors.textMuted }}>Paid</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.success }}>₹{row.paid_amount ?? 0}</Text>
            </View>
            <View style={{ flex: 0.9, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, color: Colors.textMuted }}>Pending</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: pending > 0 ? Colors.danger : Colors.success }}>
                    ₹{pending}
                </Text>
            </View>
            <View
                style={{
                    marginLeft: 10,
                    borderRadius: 999,
                    backgroundColor: tone.bg,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                }}
            >
                <Text style={{ fontSize: 10, fontWeight: "800", color: tone.color }}>{row.status}</Text>
            </View>
        </Pressable>
    );
}
