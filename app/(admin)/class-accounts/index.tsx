import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import ConfirmDialog, { DialogVariant } from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useToast } from "@/components/common/ToastContext";
import { Colors, Shadows } from "@/constants/colors";
import {
    getClassAccountLoginId,
    getClassAccounts,
    resetClassAccountPassword,
    setClassAccountStatus,
} from "@/services/account.service";
import { ClassAccount } from "@/types/grade";

type Row = ClassAccount & {
    grade: { id: string; name: string };
    division: { id: string; name: string };
    enabled: boolean;
};

type PendingAction = { type: "reset" | "toggle"; row: Row } | null;

// ── Account Row Card ─────────────────────────────────────────────────
function AccountCard({
    item,
    onReset,
    onToggle,
}: {
    item: Row;
    onReset: (row: Row) => void;
    onToggle: (row: Row) => void;
}) {
    const loginId = getClassAccountLoginId(item.grade.name, item.division.name);

    return (
        <View
            style={[
                {
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
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: Colors.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                    }}
                >
                    <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.primary }}>
                        {item.grade.name}-{item.division.name}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.textPrimary }}>
                        Grade {item.grade.name} · Division {item.division.name}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
                        {loginId}
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: item.enabled ? Colors.successLight : Colors.dangerLight,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: item.enabled ? Colors.successBorder : Colors.dangerBorder,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: item.enabled ? Colors.success : Colors.danger,
                        }}
                    >
                        {item.enabled ? "Active" : "Disabled"}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                    onPress={() => onReset(item)}
                    style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: Colors.inputBg,
                        borderWidth: 1,
                        borderColor: Colors.inputBorder,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Ionicons name="key-outline" size={15} color={Colors.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textSecondary }}>
                        Reset Password
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => onToggle(item)}
                    style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: item.enabled ? Colors.dangerLight : Colors.successLight,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Ionicons
                        name={item.enabled ? "lock-closed-outline" : "lock-open-outline"}
                        size={15}
                        color={item.enabled ? Colors.danger : Colors.success}
                    />
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: item.enabled ? Colors.danger : Colors.success,
                        }}
                    >
                        {item.enabled ? "Disable" : "Enable"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ClassAccountsScreen() {
    const toast = useToast();
    const [accounts, setAccounts] = useState<Row[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [busy, setBusy] = useState(false);

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const { data, error } = await getClassAccounts();
            if (error) { setError(true); return; }
            // `enabled` is a UI-only placeholder until an account-status
            // Edge Function / column exists — every account starts active.
            setAccounts(data.map((a) => ({ ...a, enabled: true })));
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAccounts();
        }, [fetchAccounts]),
    );

    const filtered = search.trim()
        ? accounts.filter((a) => {
            const q = search.toLowerCase();
            const loginId = getClassAccountLoginId(a.grade.name, a.division.name).toLowerCase();
            return (
                a.grade.name.toLowerCase().includes(q) ||
                a.division.name.toLowerCase().includes(q) ||
                loginId.includes(q)
            );
        })
        : accounts;

    const handleConfirm = useCallback(async () => {
        if (!pendingAction) return;
        try {
            setBusy(true);
            if (pendingAction.type === "reset") {
                const { error } = await resetClassAccountPassword(pendingAction.row.id);
                if (error) {
                    toast.info("Not Available", error.message);
                } else {
                    toast.success("Password Reset", "New password has been generated");
                }
            } else {
                const nextEnabled = !pendingAction.row.enabled;
                const { error } = await setClassAccountStatus(pendingAction.row.id, nextEnabled);
                if (error) {
                    toast.info("Not Available", error.message);
                } else {
                    toast.success("Updated", `Account ${nextEnabled ? "enabled" : "disabled"}`);
                }
            }
        } finally {
            setBusy(false);
            setPendingAction(null);
        }
    }, [pendingAction, toast]);

    if (loading) {
        return <LoadingState title="Loading Class Accounts" subtitle="Fetching class accounts..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch class accounts. Please try again."
                onRetry={fetchAccounts}
            />
        );
    }

    const dialogVariant: DialogVariant =
        pendingAction?.type === "reset"
            ? "info"
            : pendingAction?.row.enabled
                ? "danger"
                : "warning";

    const dialogTitle = pendingAction
        ? pendingAction.type === "reset"
            ? `Reset password for ${pendingAction.row.grade.name}-${pendingAction.row.division.name}?`
            : `${pendingAction.row.enabled ? "Disable" : "Enable"} ${pendingAction.row.grade.name}-${pendingAction.row.division.name}?`
        : "";

    return (
        <ScreenWrapper>
            <PageHeader
                title="Class Accounts"
                subtitle={`${accounts.length} registered`}
                showBack
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
                <Ionicons name="search" size={18} color={Colors.iconDefault} style={{ marginRight: 10 }} />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by grade, division or login ID..."
                    placeholderTextColor={Colors.textMuted}
                    style={{ flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 10 }}
                />
                {search.length > 0 && (
                    <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel="Clear search">
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </Pressable>
                )}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <AccountCard
                        item={item}
                        onReset={(row) => setPendingAction({ type: "reset", row })}
                        onToggle={(row) => setPendingAction({ type: "toggle", row })}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={
                    <EmptyState
                        title={search.trim() ? "No Results" : "No Class Accounts Yet"}
                        subtitle={
                            search.trim()
                                ? `No class accounts match "${search}"`
                                : "Create a grade to generate class accounts."
                        }
                        icon="people-outline"
                        iconColor={Colors.primary}
                        iconBgColor={Colors.primaryLight}
                    />
                }
            />

            <ConfirmDialog
                visible={!!pendingAction}
                variant={dialogVariant}
                title={dialogTitle}
                subtitle={
                    pendingAction?.type === "reset"
                        ? "A new password will be generated for this class account."
                        : "This account's ability to sign in will change immediately."
                }
                confirmLabel={busy ? "Please wait..." : "Confirm"}
                cancelLabel="Cancel"
                onConfirm={handleConfirm}
                onCancel={() => setPendingAction(null)}
            />
        </ScreenWrapper>
    );
}
