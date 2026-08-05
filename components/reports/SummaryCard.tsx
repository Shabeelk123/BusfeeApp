import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Colors, Radius, Shadows } from "../../constants/colors";

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
            style={[
                { flex: 1, borderRadius: Radius.card, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorderLight, padding: 14 },
                Shadows.card,
            ]}
        >
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Ionicons name={icon} size={16} color={iconColor} />
            </View>
            <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: "800", color: Colors.textPrimary }}>
                {value}
            </Text>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{label}</Text>
        </View>
    );
}
