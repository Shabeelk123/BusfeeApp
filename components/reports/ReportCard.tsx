import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import AppButton from "../common/AppButton";

const T = {
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    outline: "#e2e8f0",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
} as const;

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
            style={{
                borderRadius: 16,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: T.outline,
                padding: 16,
                marginBottom: 12,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: T.navyLight, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                    <Ionicons name={icon} size={18} color={T.navy} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>{title}</Text>
            </View>

            <Text style={{ fontSize: 12, color: T.onSurfaceVariant, lineHeight: 18, marginBottom: 14 }}>
                {description}
            </Text>

            {children}

            <View style={{ flexDirection: "row", gap: 10, marginTop: children ? 14 : 0 }}>
                <View style={{ flex: 1 }}>
                    <AppButton label="View" variant="secondary" size="sm" iconLeft="eye-outline" onPress={onView} fullWidth />
                </View>
                <View style={{ flex: 1 }}>
                    <AppButton
                        label="Download"
                        variant="navy"
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
