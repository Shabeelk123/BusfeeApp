import { Radius } from "@/constants/colors";
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

// ─── Theme (Stitch: "Academic Transit Logistics" — matches every dashboard) ────
const T = {
    background: "#f7fafc",
    surface: "#ffffff",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    outline: "#e2e8f0",
} as const;

type Role = "ADMIN" | "STUDENT" | "CLASS" | "COORDINATOR";

interface RoleCard {
    role: Role;
    label: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const ROLES: RoleCard[] = [
    {
        role: "ADMIN",
        label: "Administrator",
        subtitle: "Manage school & reports",
        icon: "shield-checkmark",
    },
    {
        role: "CLASS",
        label: "Class Account",
        subtitle: "Manage students & fee collections for your class",
        icon: "school-outline",
    },
    {
        role: "COORDINATOR",
        label: "Coordinator",
        subtitle: "View fee status across your grade",
        icon: "analytics-outline",
    },
    {
        role: "STUDENT",
        label: "Student",
        subtitle: "View your fee status & payments",
        icon: "school",
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

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 30,
        }).start();
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
                style={styles.card}
            >
                {/* Icon badge */}
                <View style={styles.iconBadge}>
                    <Ionicons
                        name={card.icon}
                        size={32}
                        color={T.navy}
                    />
                </View>

                {/* Text */}
                <View style={styles.cardText}>
                    <Text style={styles.cardLabel}>
                        {card.label}
                    </Text>
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>

                {/* Arrow */}
                <View style={styles.arrowBadge}>
                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={T.navy}
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
            style={{ flex: 1, backgroundColor: T.background }}
        >
            <View style={styles.container}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    {/* Logo */}
                    <View style={styles.logoBadge}>
                        <Ionicons name="bus" size={40} color="#ffffff" />
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
        backgroundColor: T.navy,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        shadowColor: T.navy,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    appName: {
        fontSize: 26,
        fontWeight: "900",
        letterSpacing: -0.5,
        color: T.onSurface,
        marginBottom: 4,
    },
    appTagline: {
        fontSize: 13,
        color: T.onSurfaceVariant,
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
        backgroundColor: T.outline,
    },
    dividerText: {
        fontSize: 13,
        color: T.onSurfaceVariant,
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
        borderWidth: 1,
        borderColor: T.outline,
        backgroundColor: T.surface,
        padding: 18,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    iconBadge: {
        width: 54,
        height: 54,
        borderRadius: 14,
        backgroundColor: T.navyLight,
        alignItems: "center",
        justifyContent: "center",
    },
    cardText: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: T.onSurface,
        marginBottom: 3,
    },
    cardSubtitle: {
        fontSize: 12,
        color: T.onSurfaceVariant,
        lineHeight: 17,
    },
    arrowBadge: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: T.navyLight,
        alignItems: "center",
        justifyContent: "center",
    },

    // Footer
    footer: {
        textAlign: "center",
        fontSize: 12,
        color: T.onSurfaceVariant,
        lineHeight: 18,
    },
});
