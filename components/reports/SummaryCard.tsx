import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

const T = {
    outline: "#e2e8f0",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
} as const;

/**
 * One KPI tile on the Reports hub (Total Collection, Pending, Students Paid,
 * Defaulters). Shared by Admin and Coordinator Reports — Coordinator just
 * passes grade-scoped numbers.
 */
export default function SummaryCard({
    label,
    value,
    icon,
    iconColor,
    iconBg,
}: {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <View
            style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: T.outline,
                padding: 14,
            }}
        >
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Ionicons name={icon} size={16} color={iconColor} />
            </View>
            <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: "800", color: T.onSurface }}>
                {value}
            </Text>
            <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 2 }}>{label}</Text>
        </View>
    );
}
