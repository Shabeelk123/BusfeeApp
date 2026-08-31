import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    navy: "#1a2b48",
    inactive: "#8a8d93",
    surface: "#ffffff",
    outline: "#e2e8f0",
} as const;

// Admin's 4 primary sections as a bottom tab bar — Dashboard, Students,
// Reports, Menu. No standalone Defaulters tab: Reports' "Defaulters Report"
// covers the same list (any month, class filter, PDF export) so a second,
// current-month-only defaulters screen would just be duplicate UI. Menu
// replaces the hamburger drawer entirely for Admin — Grades, Account
// Management, Privacy, About and Sign Out all live there now instead of a
// separate drawer paradigm.
// Nested inside app/(admin)/_layout.tsx's <Stack>, so pushing to a detail
// screen (students/[id], students/create, reports/class-wise, grades/*,
// coordinator-accounts/*, ... — all siblings of this (tabs) group, not
// children of it) hides the tab bar automatically, like a normal stack push.
export default function AdminTabsLayout() {
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
