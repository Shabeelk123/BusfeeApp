import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import AppButton from "../common/AppButton";

const T = {
    navy: "#1a2b48",
    outline: "#e2e8f0",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
} as const;

/**
 * The generated-report result box on Class-wise Report and Defaulters
 * Report — title/count header, either the row list or an empty state, and a
 * Download PDF button. Both screens generate then render a report the same
 * way; this is the one place that shape lives instead of two copies of it.
 */
export default function ReportResultCard({
    title,
    countLabel,
    isEmpty,
    emptyIcon,
    emptyIconColor,
    emptyText,
    onDownload,
    downloading,
    children,
}: {
    title: string;
    countLabel: string;
    isEmpty: boolean;
    emptyIcon: keyof typeof Ionicons.glyphMap;
    emptyIconColor: string;
    emptyText: string;
    onDownload: () => void;
    downloading: boolean;
    children: React.ReactNode;
}) {
    return (
        <View
            style={{
                marginTop: 14,
                borderRadius: 16,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: T.outline,
                padding: 16,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "800", color: T.onSurface, marginRight: 8 }}>
                    {title}
                </Text>
                <Text style={{ fontSize: 12, color: T.onSurfaceVariant }}>{countLabel}</Text>
            </View>

            {isEmpty ? (
                <View style={{ alignItems: "center", paddingVertical: 24 }}>
                    <Ionicons name={emptyIcon} size={28} color={emptyIconColor} />
                    <Text style={{ marginTop: 8, fontSize: 13, color: T.onSurfaceVariant, textAlign: "center" }}>
                        {emptyText}
                    </Text>
                </View>
            ) : (
                <View style={{ marginTop: 8 }}>{children}</View>
            )}

            {!isEmpty && (
                <View style={{ marginTop: 16 }}>
                    <AppButton
                        label="Download PDF"
                        variant="navy"
                        iconLeft="download-outline"
                        onPress={onDownload}
                        loading={downloading}
                        disabled={downloading}
                        fullWidth
                    />
                </View>
            )}
        </View>
    );
}
