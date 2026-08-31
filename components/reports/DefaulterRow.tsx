import { Text, View } from "react-native";

import { DetailedReportRow } from "../../utils/generateDetailedReport";

const T = {
    outline: "#e2e8f0",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    danger: "#e53e3e",
} as const;

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
                borderBottomColor: T.outline,
            }}
        >
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: T.onSurface }}>
                    {row.studentName}
                </Text>
                <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 1 }}>{row.className}</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "800", color: T.danger }}>
                ₹{row.pending}
            </Text>
        </View>
    );
}
