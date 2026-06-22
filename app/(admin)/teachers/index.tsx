import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

import AppButton from "@/components/common/AppButton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors, Shadows } from "@/constants/colors";
import { getTeachers } from "@/services/teacher.service";

// ── Teacher Card ─────────────────────────────────────────────────────────────
function TeacherCard({ item }: { item: any }) {
    const initials = (item.name as string)
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <View
            style={[
                {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: Colors.cardBorderLight,
                    padding: 16,
                    marginBottom: 12,
                },
                Shadows.card,
            ]}
        >
            {/* Avatar */}
            <View
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: Colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                }}
            >
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: Colors.primary,
                    }}
                >
                    {initials}
                </Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: Colors.textPrimary,
                    }}
                >
                    {item.name}
                </Text>
                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 13,
                        color: Colors.textSecondary,
                        marginTop: 2,
                    }}
                >
                    {item.email}
                </Text>
            </View>

            {/* Class badge */}
            {item.assigned_class ? (
                <View
                    style={{
                        backgroundColor: Colors.primaryLight,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: Colors.primaryBorder,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: Colors.primary,
                        }}
                    >
                        {item.assigned_class}
                    </Text>
                </View>
            ) : (
                <View
                    style={{
                        backgroundColor: Colors.warningLight,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: Colors.warningBorder,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: Colors.warning,
                        }}
                    >
                        Unassigned
                    </Text>
                </View>
            )}
        </View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TeachersScreen() {
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchTeachers = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const { data, error } = await getTeachers();
            if (error) { setError(true); return; }
            setAllTeachers(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchTeachers();
        }, [fetchTeachers]),
    );

    const filtered = search.trim()
        ? allTeachers.filter(
            (t) =>
                t.name?.toLowerCase().includes(search.toLowerCase()) ||
                t.email?.toLowerCase().includes(search.toLowerCase()) ||
                t.assigned_class?.toLowerCase().includes(search.toLowerCase()),
        )
        : allTeachers;

    if (loading) {
        return (
            <LoadingState
                title="Loading Teachers"
                subtitle="Fetching teacher accounts..."
            />
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch teacher records. Please try again."
                onRetry={fetchTeachers}
            />
        );
    }

    return (
        <ScreenWrapper>
            {/* Header */}
            <PageHeader
                title="Teachers"
                subtitle={`${allTeachers.length} registered`}
                showBack
                action={
                    <AppButton
                        label="+ Add"
                        onPress={() => router.push("/(admin)/teachers/create")}
                        size="sm"
                        variant="primary"
                    />
                }
            />

            {/* Search Bar */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.card,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: Colors.inputBorder,
                    paddingHorizontal: 14,
                    minHeight: 48,
                    marginBottom: 16,
                }}
            >
                <Ionicons
                    name="search"
                    size={18}
                    color={Colors.iconDefault}
                    style={{ marginRight: 10 }}
                />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by name, email or class..."
                    placeholderTextColor={Colors.textMuted}
                    style={{
                        flex: 1,
                        fontSize: 15,
                        color: Colors.textPrimary,
                        paddingVertical: 10,
                    }}
                />
                {search.length > 0 && (
                    <Pressable
                        onPress={() => setSearch("")}
                        hitSlop={8}
                        accessibilityLabel="Clear search"
                    >
                        <Ionicons
                            name="close-circle"
                            size={18}
                            color={Colors.textMuted}
                        />
                    </Pressable>
                )}
            </View>

            {/* List */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <TeacherCard item={item} />}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={
                    <EmptyState
                        title={
                            search.trim()
                                ? "No Results"
                                : "No Teachers Yet"
                        }
                        subtitle={
                            search.trim()
                                ? `No teachers match "${search}"`
                                : `Tap "Add Teacher" to register the first teacher.`
                        }
                        icon="people-outline"
                        iconColor={Colors.primary}
                        iconBgColor={Colors.primaryLight}
                        actionLabel={
                            !search.trim() ? "Add Teacher" : undefined
                        }
                        onAction={
                            !search.trim()
                                ? () =>
                                    router.push(
                                        "/(admin)/teachers/create",
                                    )
                                : undefined
                        }
                    />
                }
            />
        </ScreenWrapper>
    );
}
