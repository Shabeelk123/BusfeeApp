import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Text, View } from "react-native";

import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { getCurrentClassAccount } from "@/services/account.service";
import { getCurrentMonthDefaulters } from "@/services/defaulters.service";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background:  "#f7fafc",
    onSurface:   "#181c1e",
    onSurfaceVariant: "#44474d",
    outline:     "#e2e8f0",
    success:     "#2d7a4d",
    successLight:"#e3f3e9",
    danger:      "#e53e3e",
    dangerLight: "#fdeaea",
} as const;

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
            <Text style={{ marginTop: 4, fontSize: 11, color: T.onSurfaceVariant, fontWeight: "500" }}>
                {label}
            </Text>
            <Text style={{ marginTop: 2, fontSize: 14, fontWeight: "800", color: valueColor }}>
                {value}
            </Text>
        </View>
    );
}

// ── Defaulter Card ────────────────────────────────────────────────────────────
// `item` is a student_monthly_fees row joined to its student (see
// defaulters.service.ts getCurrentMonthDefaulters).
function DefaulterCard({ item }: { item: any }) {
    const student = item.student;
    const pending = Math.max(0, (item.fee ?? 0) - (item.paid_amount ?? 0));

    return (
        <View
            style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: T.outline,
                padding: 16,
                marginBottom: 12,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "700", color: T.onSurface }}>
                        {student?.name}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 13, color: T.onSurfaceVariant }}>
                        #{student?.admission_no}
                    </Text>
                </View>

                <View
                    style={{
                        backgroundColor: T.dangerLight,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: T.danger,
                    }}
                >
                    <Text style={{ fontSize: 11, fontWeight: "800", color: T.danger, letterSpacing: 0.5 }}>
                        DUE
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
                <StatPill
                    icon="cash-outline"
                    label="Monthly Fee"
                    value={`₹${item.fee ?? 0}`}
                    iconColor={T.onSurfaceVariant}
                    bgColor={T.outline}
                    valueColor={T.onSurface}
                />
                <StatPill
                    icon="checkmark-circle-outline"
                    label="Paid"
                    value={`₹${item.paid_amount ?? 0}`}
                    iconColor={T.success}
                    bgColor={T.successLight}
                    valueColor={T.success}
                />
                <StatPill
                    icon="alert-circle-outline"
                    label="Pending"
                    value={`₹${pending}`}
                    iconColor={T.danger}
                    bgColor={T.dangerLight}
                    valueColor={T.danger}
                />
            </View>
        </View>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ClassDefaultersScreen() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [classLabel, setClassLabel] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);

            const { data: account, error: accountError } = await getCurrentClassAccount();
            if (accountError || !account) { setError(true); return; }

            setClassLabel(`${account.grade.name}-${account.division.name}`);

            const { data, error } = await getCurrentMonthDefaulters({
                gradeId: account.grade_id,
                divisionId: account.division_id,
            });

            if (error) { setError(true); return; }
            setRows(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData]),
    );

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
        <ScreenWrapper backgroundColor={T.background}>
            <FlatList
                data={rows}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListHeaderComponent={
                    <>
                        <PageHeader
                            title="Defaulters"
                            subtitle={classLabel ? `Class ${classLabel} — current month` : "Current month pending students"}
                        />

                        {rows.length > 0 && (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: T.dangerLight,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: T.danger,
                                    padding: 14,
                                    marginBottom: 16,
                                }}
                            >
                                <Ionicons name="warning-outline" size={20} color={T.danger} style={{ marginRight: 10 }} />
                                <Text style={{ flex: 1, fontSize: 13, color: T.danger, lineHeight: 18, fontWeight: "500" }}>
                                    {rows.length} student{rows.length !== 1 ? "s" : ""} have outstanding fee dues. Please follow up.
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
                        iconColor={T.success}
                        iconBgColor={T.successLight}
                    />
                }
                renderItem={({ item }) => <DefaulterCard item={item} />}
            />
        </ScreenWrapper>
    );
}
