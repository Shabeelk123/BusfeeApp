import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
    Animated,
    Modal,
    Pressable,
    Text,
    View,
} from "react-native";
import { Colors } from "../../constants/colors";

// Navy accent (Stitch "Academic Transit Logistics") — the drawer is opened
// from every role's dashboard, several of which (Admin, Class) now use this
// navy theme, so its own accent color needs to match rather than staying on
// the old app-wide blue.
const NAVY = "#1a2b48";
const NAVY_LIGHT = "#e8ebf2";

interface MenuItem {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sublabel?: string;
    onPress: () => void;
    variant?: "default" | "danger";
}

interface Props {
    visible: boolean;
    onClose: () => void;
    userName?: string;
    userRole?: string;
    items: MenuItem[];
}

const DRAWER_HEIGHT = 480;

export default function AppDrawer({
    visible,
    onClose,
    userName,
    userRole,
    items,
}: Props) {
    const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 180,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: DRAWER_HEIGHT,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Backdrop */}
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    opacity: backdropOpacity,
                    justifyContent: "flex-end",
                }}
            >
                <Pressable
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                    onPress={onClose}
                    accessibilityLabel="Close menu"
                />

                {/* Sheet */}
                <Animated.View
                    style={{
                        transform: [{ translateY }],
                        backgroundColor: Colors.card,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        paddingBottom: 36,
                        overflow: "hidden",
                    }}
                >
                    {/* Handle bar */}
                    <View
                        style={{
                            alignItems: "center",
                            paddingTop: 12,
                            paddingBottom: 4,
                        }}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: Colors.cardBorder,
                            }}
                        />
                    </View>

                    {/* User identity block */}
                    {(userName || userRole) && (
                        <View
                            style={{
                                paddingHorizontal: 24,
                                paddingTop: 16,
                                paddingBottom: 20,
                                borderBottomWidth: 1,
                                borderBottomColor: Colors.cardBorderLight,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 14,
                                }}
                            >
                                {/* Avatar */}
                                <View
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 24,
                                        backgroundColor: NAVY_LIGHT,
                                        borderWidth: 2,
                                        borderColor: NAVY,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontWeight: "800",
                                            color: NAVY,
                                        }}
                                    >
                                        {userName?.charAt(0).toUpperCase() ?? "U"}
                                    </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            fontSize: 16,
                                            fontWeight: "700",
                                            color: Colors.textPrimary,
                                        }}
                                    >
                                        {userName ?? "User"}
                                    </Text>
                                    {userRole && (
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: Colors.textSecondary,
                                                marginTop: 2,
                                                fontWeight: "500",
                                            }}
                                        >
                                            {userRole}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Menu items */}
                    <View style={{ paddingTop: 8, paddingHorizontal: 12 }}>
                        {items.map((item, index) => {
                            const isDanger = item.variant === "danger";
                            const isLast = index === items.length - 1;
                            return (
                                <View key={item.id}>
                                    {/* Divider before danger items */}
                                    {isDanger && index > 0 && (
                                        <View
                                            style={{
                                                height: 1,
                                                backgroundColor: Colors.cardBorderLight,
                                                marginVertical: 8,
                                                marginHorizontal: 4,
                                            }}
                                        />
                                    )}
                                    <Pressable
                                        onPress={() => {
                                            onClose();
                                            // Small delay so the modal closes before navigation
                                            setTimeout(item.onPress, 180);
                                        }}
                                        style={({ pressed }) => ({
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingHorizontal: 16,
                                            paddingVertical: 14,
                                            borderRadius: 14,
                                            backgroundColor: pressed
                                                ? isDanger
                                                    ? Colors.dangerLight
                                                    : Colors.cardBorderLight
                                                : "transparent",
                                            gap: 14,
                                        })}
                                        accessibilityRole="button"
                                        accessibilityLabel={item.label}
                                    >
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 12,
                                                backgroundColor: isDanger
                                                    ? Colors.dangerLight
                                                    : NAVY_LIGHT,
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Ionicons
                                                name={item.icon}
                                                size={20}
                                                color={
                                                    isDanger
                                                        ? Colors.danger
                                                        : NAVY
                                                }
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: "600",
                                                    color: isDanger
                                                        ? Colors.danger
                                                        : Colors.textPrimary,
                                                }}
                                            >
                                                {item.label}
                                            </Text>
                                            {item.sublabel && (
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        color: Colors.textMuted,
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    {item.sublabel}
                                                </Text>
                                            )}
                                        </View>

                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color={
                                                isDanger
                                                    ? Colors.danger
                                                    : Colors.textMuted
                                            }
                                        />
                                    </Pressable>
                                </View>
                            );
                        })}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
