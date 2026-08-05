import { Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { DetailedReportRow } from "../../utils/generateDetailedReport";

/**
 * One row in the Defaulters Report's result table (name, class, pending).
 * Shared by Admin and Coordinator Defaulters Report.
 */
export default function DefaulterRow({ row, isLast }: { row: DetailedReportRow; isLast: boolean }) {
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
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: Colors.textPrimary }}>
                    {row.studentName}
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>{row.className}</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.danger }}>
                ₹{row.pending}
            </Text>
        </View>
    );
}
