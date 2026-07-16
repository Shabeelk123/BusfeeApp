import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors } from "@/constants/colors";

const PRIVACY_POLICY_URL = "https://busfeeapp.netlify.app";

export default function PrivacyPolicyScreen() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <ScreenWrapper>
            <PageHeader
                title="Privacy Policy"
                subtitle={PRIVACY_POLICY_URL}
                showBack
            />

            <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
                {loading && !error && (
                    <View
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: Colors.background,
                            zIndex: 10,
                        }}
                    >
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text
                            style={{
                                marginTop: 12,
                                fontSize: 13,
                                color: Colors.textSecondary,
                            }}
                        >
                            Loading Privacy Policy…
                        </Text>
                    </View>
                )}

                {error ? (
                    <View
                        style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 32,
                        }}
                    >
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 20,
                                backgroundColor: Colors.dangerLight,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons
                                name="wifi-outline"
                                size={32}
                                color={Colors.danger}
                            />
                        </View>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "800",
                                color: Colors.textPrimary,
                                textAlign: "center",
                            }}
                        >
                            Unable to Load
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                color: Colors.textSecondary,
                                textAlign: "center",
                                marginTop: 8,
                                lineHeight: 20,
                            }}
                        >
                            Please check your internet connection and try again.
                        </Text>
                    </View>
                ) : (
                    <WebView
                        source={{ uri: PRIVACY_POLICY_URL }}
                        onLoadStart={() => { setLoading(true); setError(false); }}
                        onLoadEnd={() => setLoading(false)}
                        onError={() => { setLoading(false); setError(true); }}
                        style={{ flex: 1, backgroundColor: Colors.background }}
                        showsVerticalScrollIndicator={false}
                        allowsInlineMediaPlayback
                        javaScriptEnabled
                        domStorageEnabled
                    />
                )}
            </View>
        </ScreenWrapper>
    );
}