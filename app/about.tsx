import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background: "#f7fafc",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    muted: "#8a8d93",
    outline: "#e2e8f0",
} as const;

const APP_VERSION = "1.0.0";
const WEBSITE_URL = "https://busfeeapp.netlify.app";

function InfoRow({
    icon,
    label,
    value,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    onPress?: () => void;
}) {
    const content = (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 16,
                gap: 14,
                backgroundColor: "#ffffff",
            }}
        >
            <View
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: T.navyLight,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={18} color={T.navy} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: T.muted, fontWeight: "500" }}>
                    {label}
                </Text>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: onPress ? T.navy : T.onSurface,
                        marginTop: 1,
                    }}
                >
                    {value}
                </Text>
            </View>
            {onPress && (
                <Ionicons name="open-outline" size={16} color={T.navy} />
            )}
        </View>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                accessibilityRole="link"
                accessibilityLabel={`${label}: ${value}`}
            >
                {content}
            </Pressable>
        );
    }
    return content;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={{ marginBottom: 24 }}>
            <Text
                style={{
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: T.muted,
                    marginBottom: 10,
                    marginLeft: 4,
                }}
            >
                {title}
            </Text>
            <View
                style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: T.outline,
                    overflow: "hidden",
                }}
            >
                {children}
            </View>
        </View>
    );
}

export default function AboutScreen() {
    return (
        <ScreenWrapper backgroundColor={T.background}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <PageHeader title="About" showBack />

                {/* App hero */}
                <View
                    style={{
                        borderRadius: 20,
                        backgroundColor: T.navy,
                        padding: 24,
                        marginBottom: 24,
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 22,
                            backgroundColor: "rgba(255,255,255,0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 14,
                        }}
                    >
                        <Ionicons name="bus" size={38} color="white" />
                    </View>
                    <Text
                        style={{
                            fontSize: 22,
                            fontWeight: "900",
                            color: "white",
                            letterSpacing: -0.5,
                        }}
                    >
                        BusFee Tracker
                    </Text>
                    <Text
                        style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.65)",
                            marginTop: 4,
                        }}
                    >
                        Version {APP_VERSION}
                    </Text>
                </View>

                {/* App Info */}
                <Section title="Application">
                    <InfoRow icon="information-circle-outline" label="Version" value={APP_VERSION} />
                    <View style={{ height: 1, backgroundColor: T.outline }} />
                    <InfoRow
                        icon="globe-outline"
                        label="Website"
                        value={WEBSITE_URL}
                        onPress={() => Linking.openURL(WEBSITE_URL)}
                    />
                </Section>

                {/* Description */}
                <Section title="About This App">
                    <View
                        style={{
                            padding: 14,
                            backgroundColor: "#ffffff",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                color: T.onSurfaceVariant,
                                lineHeight: 22,
                            }}
                        >
                            BusFee Tracker is a school bus fee management system that helps
                            administrators and class accounts efficiently manage student fee
                            collections, track defaulters, and generate reports.
                        </Text>
                    </View>
                </Section>

                <Text
                    style={{
                        textAlign: "center",
                        fontSize: 12,
                        color: T.muted,
                    }}
                >
                    © {new Date().getFullYear()} BusFee Tracker. All rights reserved.
                </Text>
            </ScrollView>
        </ScreenWrapper>
    );
}
