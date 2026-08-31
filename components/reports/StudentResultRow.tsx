import { Text, View } from "react-native";

import { DetailedReportRow } from "../../utils/generateDetailedReport";

const T = {
    outline: "#e2e8f0",
    onSurface: "#181c1e",
    success: "#2d7a4d",
    successLight: "#e3f3e9",
    warning: "#b7791f",
    warningLight: "#fdf3e0",
    danger: "#e53e3e",
    dangerLight: "#fdeaea",
    muted: "#8a8d93",
    mutedLight: "#eef0f2",
} as const;

const STATUS_TONE: Record<string, { color: string; bg: string }> = {
    Paid:     { color: T.success, bg: T.successLight },
    Partial:  { color: T.warning, bg: T.warningLight },
    Pending:  { color: T.danger,  bg: T.dangerLight },
    Excluded: { color: T.muted,   bg: T.mutedLight },
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
                borderBottomColor: T.outline,
            }}
        >
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: "600", color: T.onSurface, marginRight: 8 }}>
                {row.studentName}
            </Text>
            <Text style={{ width: 64, textAlign: "right", fontSize: 12, fontWeight: "700", color: T.success }}>
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
