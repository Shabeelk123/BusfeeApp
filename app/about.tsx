import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors, Shadows } from "@/constants/colors";

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
            style={[
                {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    gap: 14,
                    backgroundColor: Colors.card,
                },
                Shadows.card,
            ]}
        >
            <View
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: Colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: "500" }}>
                    {label}
                </Text>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: onPress ? Colors.primary : Colors.textPrimary,
                        marginTop: 1,
                    }}
                >
                    {value}
                </Text>
            </View>
            {onPress && (
                <Ionicons name="open-outline" size={16} color={Colors.primary} />
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
                    color: Colors.textMuted,
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
                    borderColor: Colors.cardBorderLight,
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
        <ScreenWrapper>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <PageHeader title="About" showBack />

                {/* App hero */}
                <View
                    style={[
                        {
                            borderRadius: 20,
                            backgroundColor: Colors.primary,
                            padding: 24,
                            marginBottom: 28,
                            alignItems: "center",
                        },
                        Shadows.cardMd,
                    ]}
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
                    <View style={{ height: 1, backgroundColor: Colors.cardBorderLight }} />
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
                            padding: 10,
                            backgroundColor: Colors.card,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                color: Colors.textSecondary,
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
                        color: Colors.textDisabled,
                    }}
                >
                    © {new Date().getFullYear()} BusFee Tracker. All rights reserved.
                </Text>
            </ScrollView>
        </ScreenWrapper>
    );
}
