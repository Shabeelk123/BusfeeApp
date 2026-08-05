import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Colors, Radius, Shadows } from "../../constants/colors";
import AppButton from "../common/AppButton";

/**
 * One report entry on the Reports hub — title, description, an optional
 * expandable detail (`children`), and View/Download actions. Shared by
 * Admin and Coordinator Reports.
 */
export default function ReportCard({
    title,
    description,
    icon,
    onView,
    onDownload,
    downloading,
    children,
}: {
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    onView: () => void;
    onDownload: () => void;
    downloading?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <View
            style={[
                { borderRadius: Radius.card, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorderLight, padding: 16, marginBottom: 14 },
                Shadows.card,
            ]}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                    <Ionicons name={icon} size={18} color={Colors.primary} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.textPrimary }}>{title}</Text>
            </View>

            <Text style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 14 }}>
                {description}
            </Text>

            {children}

            <View style={{ flexDirection: "row", gap: 10, marginTop: children ? 14 : 0 }}>
                <View style={{ flex: 1 }}>
                    <AppButton label="View Report" variant="secondary" size="sm" iconLeft="eye-outline" onPress={onView} fullWidth />
                </View>
                <View style={{ flex: 1 }}>
                    <AppButton
                        label="Download PDF"
                        variant="primary"
                        size="sm"
                        iconLeft="download-outline"
                        onPress={onDownload}
                        loading={downloading}
                        disabled={downloading}
                        fullWidth
                    />
                </View>
            </View>
        </View>
    );
}
