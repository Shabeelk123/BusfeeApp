import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    navy: "#1a2b48",
    inactive: "#8a8d93",
    surface: "#ffffff",
    outline: "#e2e8f0",
} as const;

// Class's 3 primary sections as a bottom tab bar — Dashboard, Students,
// Defaulters. Nested inside app/(class)/_layout.tsx's <Stack>, so pushing to
// a detail screen (students/[id], students/add-payment — both siblings of
// this (tabs) group, not children of it) hides the tab bar automatically,
// exactly like a normal stack push.
export default function ClassTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: T.navy,
                tabBarInactiveTintColor: T.inactive,
                tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
                tabBarStyle: {
                    backgroundColor: T.surface,
                    borderTopColor: T.outline,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 6,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="students"
                options={{
                    title: "Students",
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="defaulters"
                options={{
                    title: "Defaulters",
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons name={focused ? "alert-circle" : "alert-circle-outline"} size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
