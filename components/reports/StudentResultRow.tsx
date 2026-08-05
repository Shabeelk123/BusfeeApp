import { Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { DetailedReportRow } from "../../utils/generateDetailedReport";

const STATUS_TONE: Record<string, { color: string; bg: string }> = {
    Paid:     { color: Colors.success, bg: Colors.successLight },
    Partial:  { color: Colors.warning, bg: Colors.warningLight },
    Pending:  { color: Colors.danger,  bg: Colors.dangerLight },
    Excluded: { color: Colors.textMuted, bg: Colors.cardBorderLight },
};

/**
 * One row in the Class-wise Report's result table (name, paid, status).
 * Shared by Admin and Coordinator Class-wise Report.
 */
export default function StudentResultRow({ row, isLast }: { row: DetailedReportRow; isLast: boolean }) {
    const tone = STATUS_TONE[row.status] ?? STATUS_TONE.Pending;
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: Colors.cardBorderLight,
            }}
        >
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: "600", color: Colors.textPrimary, marginRight: 8 }}>
                {row.studentName}
            </Text>
            <Text style={{ width: 64, textAlign: "right", fontSize: 12, fontWeight: "700", color: Colors.success }}>
                ₹{row.paid}
            </Text>
            <View
                style={{
                    marginLeft: 8,
                    borderRadius: 999,
                    backgroundColor: tone.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    minWidth: 60,
                    alignItems: "center",
                }}
            >
                <Text style={{ fontSize: 10, fontWeight: "800", color: tone.color }}>{row.status}</Text>
            </View>
        </View>
    );
}
