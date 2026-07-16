import { Colors, Radius, Shadows } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Role = "ADMIN" | "TEACHER" | "STUDENT";

interface RoleCard {
    role: Role;
    label: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    colorLight: string;
    colorBorder: string;
}

const ROLES: RoleCard[] = [
    {
        role: "ADMIN",
        label: "Administrator",
        subtitle: "Manage school, teachers & reports",
        icon: "shield-checkmark",
        color: "#2563EB",
        colorLight: "#EFF6FF",
        colorBorder: "#BFDBFE",
    },
    {
        role: "TEACHER",
        label: "Teacher",
        subtitle: "Manage students & fee collections",
        icon: "people",
        color: "#059669",
        colorLight: "#D1FAE5",
        colorBorder: "#A7F3D0",
    },
    {
        role: "STUDENT",
        label: "Student",
        subtitle: "View your fee status & payments",
        icon: "school",
        color: "#7C3AED",
        colorLight: "#EDE9FE",
        colorBorder: "#DDD6FE",
    },
];

function AnimatedRoleCard({
    card,
    onPress,
}: {
    card: RoleCard;
    onPress: () => void;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    const elevation = useRef(new Animated.Value(3)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 0.97,
                useNativeDriver: true,
                speed: 30,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.card,
                    {
                        borderColor: card.colorBorder,
                        backgroundColor: Colors.card,
                    },
                ]}
            >
                {/* Icon badge */}
                <View
                    style={[
                        styles.iconBadge,
                        { backgroundColor: card.colorLight },
                    ]}
                >
                    <Ionicons
                        name={card.icon}
                        size={32}
                        color={card.color}
                    />
                </View>

                {/* Text */}
                <View style={styles.cardText}>
                    <Text
                        style={[styles.cardLabel, { color: Colors.textPrimary }]}
                    >
                        {card.label}
                    </Text>
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>

                {/* Arrow */}
                <View
                    style={[
                        styles.arrowBadge,
                        { backgroundColor: card.colorLight },
                    ]}
                >
                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={card.color}
                    />
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default function RoleSelectScreen() {
    const handleRolePress = (role: Role) => {
        router.push({
            pathname: "/(auth)/login",
            params: { role },
        });
    };

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: Colors.background }}
        >
            <View style={styles.container}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    {/* Logo */}
                    <View style={styles.logoBadge}>
                        <Ionicons name="bus" size={40} color="#fff" />
                    </View>

                    <Text style={styles.appName}>BusFee Tracker</Text>
                    <Text style={styles.appTagline}>
                        School Transport Management
                    </Text>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>
                            Sign in as
                        </Text>
                        <View style={styles.dividerLine} />
                    </View>
                </View>

                {/* ── Role Cards ── */}
                <View style={styles.cardsContainer}>
                    {ROLES.map((card) => (
                        <AnimatedRoleCard
                            key={card.role}
                            card={card}
                            onPress={() => handleRolePress(card.role)}
                        />
                    ))}
                </View>

                {/* ── Footer ── */}
                <Text style={styles.footer}>
                    School ERP Management System © 2026
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 20,
        justifyContent: "space-between",
    },

    // Header
    header: {
        alignItems: "center",
    },
    logoBadge: {
        width: 76,
        height: 76,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        shadowColor: Colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    appName: {
        fontSize: 26,
        fontWeight: "900",
        letterSpacing: -0.5,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    appTagline: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.cardBorder,
    },
    dividerText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: "500",
    },

    // Cards
    cardsContainer: {
        gap: 12,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        borderRadius: Radius.card,
        borderWidth: 1.5,
        padding: 18,
        ...Shadows.cardMd,
    },
    iconBadge: {
        width: 54,
        height: 54,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    cardText: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 3,
    },
    cardSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 17,
    },
    arrowBadge: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    // Footer
    footer: {
        textAlign: "center",
        fontSize: 12,
        color: Colors.textMuted,
        lineHeight: 18,
    },
});
