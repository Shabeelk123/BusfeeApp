import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    navy: "#1a2b48",
    inactive: "#8a8d93",
    surface: "#ffffff",
    outline: "#e2e8f0",
} as const;

// Coordinator's primary sections as a bottom tab bar — Dashboard, Students,
// Reports, Menu. Nested inside app/(coordinator)/_layout.tsx's <Stack>, so
// pushing to a detail screen (students/[id], reports/class-wise,
// reports/defaulters, defaulters — all siblings of this (tabs) group, not
// children of it) hides the tab bar automatically, exactly like a normal
// stack push. Mirrors app/(admin)/(tabs)/_layout.tsx and
// app/(class)/(tabs)/_layout.tsx.
export default function CoordinatorTabsLayout() {
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
                name="reports"
                options={{
                    title: "Reports",
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons name={focused ? "document-text" : "document-text-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: "Menu",
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons name={focused ? "menu" : "menu-outline"} size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
