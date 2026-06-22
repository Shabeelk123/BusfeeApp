import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { Colors, Shadows } from "@/constants/colors";
import { getCurrentUserProfile } from "@/services/auth.service";
import { getCurrentMonthDefaulters } from "@/services/defaulters.service";

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({
    icon,
    label,
    value,
    iconColor,
    bgColor,
    valueColor,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    iconColor: string;
    bgColor: string;
    valueColor: string;
}) {
    return (
        <View
            style={{
                flex: 1,
                alignItems: "center",
                borderRadius: 12,
                backgroundColor: bgColor,
                paddingVertical: 10,
                paddingHorizontal: 8,
            }}
        >
            <Ionicons name={icon} size={16} color={iconColor} />
            <Text
                style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: Colors.textMuted,
                    fontWeight: "500",
                }}
            >
                {label}
            </Text>
            <Text
                style={{
                    marginTop: 2,
                    fontSize: 14,
                    fontWeight: "800",
                    color: valueColor,
                }}
            >
                {value}
            </Text>
        </View>
    );
}

// ── Defaulter Card ────────────────────────────────────────────────────────────
function DefaulterCard({ item }: { item: any }) {
    return (
        <View
            style={[
                {
                    backgroundColor: Colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: Colors.dangerBorder,
                    padding: 16,
                    marginBottom: 12,
                },
                Shadows.card,
            ]}
        >
            {/* Top row */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                        numberOfLines={1}
                        style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: Colors.textPrimary,
                        }}
                    >
                        {item.full_name}
                    </Text>
                    <Text
                        style={{
                            marginTop: 2,
                            fontSize: 13,
                            color: Colors.textSecondary,
                        }}
                    >
                        Class: {item.class_name}
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor: Colors.dangerLight,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: Colors.dangerBorder,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: Colors.danger,
                            letterSpacing: 0.5,
                        }}
                    >
                        DUE
                    </Text>
                </View>
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: "row", gap: 8 }}>
                <StatPill
                    icon="cash-outline"
                    label="Monthly Fee"
                    value={`₹${item.monthlyFee}`}
                    iconColor={Colors.textSecondary}
                    bgColor={Colors.cardBorderLight}
                    valueColor={Colors.textPrimary}
                />
                <StatPill
                    icon="checkmark-circle-outline"
                    label="Paid"
                    value={`₹${item.paid}`}
                    iconColor={Colors.success}
                    bgColor={Colors.successLight}
                    valueColor={Colors.success}
                />
                <StatPill
                    icon="alert-circle-outline"
                    label="Pending"
                    value={`₹${item.pending}`}
                    iconColor={Colors.danger}
                    bgColor={Colors.dangerLight}
                    valueColor={Colors.danger}
                />
            </View>
        </View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TeacherDefaultersScreen() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [assignedClass, setAssignedClass] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(false);
            const profile = await getCurrentUserProfile();
            if (!profile) return;

            const teacherClass = profile.assigned_class;
            setAssignedClass(teacherClass);

            const { data, error } = await getCurrentMonthDefaulters({
                selectedClass: teacherClass ?? "ALL",
            });

            if (error) { console.log(error); setError(true); return; }
            setStudents(data);
        } catch (error) {
            console.log(error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <LoadingState
                title="Loading Defaulters"
                subtitle="Fetching current month pending students…"
            />
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch defaulters. Please try again."
                onRetry={fetchData}
            />
        );
    }

    return (
        <ScreenWrapper>
            <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListHeaderComponent={
                    <>
                        {/* Page Header with back button */}
                        <PageHeader
                            title="Defaulters"
                            subtitle={
                                assignedClass
                                    ? `Class ${assignedClass} — current month`
                                    : "Current month pending students"
                            }
                            showBack
                        />

                        {/* Alert banner */}
                        {students.length > 0 && (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: Colors.dangerLight,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: Colors.dangerBorder,
                                    padding: 14,
                                    marginBottom: 16,
                                }}
                            >
                                <Ionicons
                                    name="warning-outline"
                                    size={20}
                                    color={Colors.danger}
                                    style={{ marginRight: 10 }}
                                />
                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        color: Colors.danger,
                                        lineHeight: 18,
                                        fontWeight: "500",
                                    }}
                                >
                                    {students.length} student
                                    {students.length !== 1 ? "s" : ""} have
                                    outstanding fee dues. Please follow up.
                                </Text>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={
                    <EmptyState
                        title="No Defaulters"
                        subtitle="All students in your class have cleared their current month dues."
                        icon="checkmark-circle-outline"
                        iconColor={Colors.success}
                        iconBgColor={Colors.successLight}
                    />
                }
                renderItem={({ item }) => <DefaulterCard item={item} />}
            />
        </ScreenWrapper>
    );
}
