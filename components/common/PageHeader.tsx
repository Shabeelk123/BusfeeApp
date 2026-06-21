import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

interface Props {
    title: string;
    subtitle?: string;
    /** Show a ← back chevron that calls router.back() */
    showBack?: boolean;
    /** Custom back handler */
    onBack?: () => void;
    /** Right-side action slot */
    action?: React.ReactNode;
}

export default function PageHeader({
    title,
    subtitle,
    showBack = false,
    onBack,
    action,
}: Props) {
    const handleBack = onBack ?? (() => router.back());

    return (
        <View style={{ marginBottom: 24 }}>
            {showBack && (
                <Pressable
                    onPress={handleBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        backgroundColor: Colors.card,
                        borderRadius: 10,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        marginBottom: 16,
                        opacity: pressed ? 0.7 : 1,
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 1,
                    })}
                >
                    <Ionicons
                        name="arrow-back"
                        size={16}
                        color={Colors.primary}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary }}>
                        Back
                    </Text>
                </Pressable>
            )}

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: "800",
                            color: Colors.textPrimary,
                            letterSpacing: -0.5,
                        }}
                    >
                        {title}
                    </Text>
                    {subtitle && (
                        <Text
                            style={{
                                fontSize: 13,
                                color: Colors.textSecondary,
                                marginTop: 3,
                            }}
                        >
                            {subtitle}
                        </Text>
                    )}
                </View>
                {action && <View style={{ marginLeft: 12 }}>{action}</View>}
            </View>
        </View>
    );
}
