import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";

import AccountCard from "@/components/accounts/AccountCard";
import ResetPasswordDialog from "@/components/accounts/ResetPasswordDialog";
import AppButton from "@/components/common/AppButton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useAccountActions } from "@/hooks/useAccountActions";
import {
    deleteCoordinatorAccount,
    getCoordinatorAccountLoginId,
    getCoordinatorAccounts,
    resetCoordinatorAccountPassword,
    setCoordinatorAccountStatus,
} from "@/services/account.service";
import { CoordinatorAccount } from "@/types/grade";

// ─── Theme (Stitch: "Academic Transit Logistics" — matches the Admin Dashboard) ─
const T = {
    background: "#f7fafc",
    navy: "#1a2b48",
    navyLight: "#e8ebf2",
    onSurface: "#181c1e",
    onSurfaceVariant: "#44474d",
    muted: "#8a8d93",
    outline: "#e2e8f0",
} as const;

type Row = CoordinatorAccount & {
    grade: { id: string; name: string };
    user: { name: string };
    enabled: boolean;
};

// ── Screen ───────────────────────────────────────────────────────────────────
export default function CoordinatorAccountsScreen() {
    const [accounts, setAccounts] = useState<Row[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const { data, error } = await getCoordinatorAccounts();
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

    const {
        toggleTarget,
        setToggleTarget,
        deleteTarget,
        setDeleteTarget,
        resetTarget,
        setResetTarget,
        busy,
        confirmToggle,
        confirmDelete,
        confirmReset,
    } = useAccountActions<Row>({
        entityLabel: (row) => `Grade ${row.grade.name} Coordinator`,
        resetPassword: resetCoordinatorAccountPassword,
        setStatus: setCoordinatorAccountStatus,
        deleteAccount: deleteCoordinatorAccount,
        onChanged: fetchAccounts,
    });

    const filtered = search.trim()
        ? accounts.filter((a) => {
            const q = search.toLowerCase();
            const loginId = getCoordinatorAccountLoginId(a.grade.name).toLowerCase();
            return (
                a.grade.name.toLowerCase().includes(q) ||
                a.user.name.toLowerCase().includes(q) ||
                loginId.includes(q)
            );
        })
        : accounts;

    if (loading) {
        return <LoadingState title="Loading Coordinator Accounts" subtitle="Fetching coordinator accounts..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load"
                subtitle="Could not fetch coordinator accounts. Please try again."
                onRetry={fetchAccounts}
            />
        );
    }

    return (
        <ScreenWrapper backgroundColor={T.background}>
            <PageHeader
                title="Coordinator Accounts"
                subtitle={`${accounts.length} registered`}
                showBack
                action={
                    <AppButton
                        label="+ Add"
                        onPress={() => router.push("/(admin)/coordinator-accounts/create")}
                        size="sm"
                        variant="navy"
                    />
                }
            />

            {/* Search Bar */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: T.outline,
                    paddingHorizontal: 14,
                    minHeight: 48,
                    marginBottom: 16,
                }}
            >
                <Ionicons name="search" size={18} color={T.muted} style={{ marginRight: 10 }} />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by grade, name or login ID..."
                    placeholderTextColor={T.muted}
                    style={{ flex: 1, fontSize: 15, color: T.onSurface, paddingVertical: 10 }}
                />
                {search.length > 0 && (
                    <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel="Clear search">
                        <Ionicons name="close-circle" size={18} color={T.muted} />
                    </Pressable>
                )}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <AccountCard
                        badgeLabel={`C${item.grade.name}`}
                        title={item.user.name}
                        subtitle={`Grade ${item.grade.name} Coordinator`}
                        loginId={getCoordinatorAccountLoginId(item.grade.name)}
                        enabled={item.enabled}
                        onReset={() => setResetTarget(item)}
                        onToggle={() => setToggleTarget(item)}
                        onDelete={() => setDeleteTarget(item)}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={
                    <EmptyState
                        title={search.trim() ? "No Results" : "No Coordinator Accounts Yet"}
                        subtitle={
                            search.trim()
                                ? `No coordinator accounts match "${search}"`
                                : "Add a coordinator to a grade to get started."
                        }
                        icon="analytics-outline"
                        iconColor={T.navy}
                        iconBgColor={T.navyLight}
                    />
                }
            />

            <ConfirmDialog
                visible={!!toggleTarget}
                variant={toggleTarget?.enabled ? "danger" : "warning"}
                title={
                    toggleTarget
                        ? `${toggleTarget.enabled ? "Disable" : "Enable"} Grade ${toggleTarget.grade.name} Coordinator?`
                        : ""
                }
                subtitle="This account's ability to sign in will change immediately."
                confirmLabel={busy ? "Please wait..." : "Confirm"}
                cancelLabel="Cancel"
                onConfirm={confirmToggle}
                onCancel={() => setToggleTarget(null)}
            />

            <ConfirmDialog
                visible={!!deleteTarget}
                variant="danger"
                title={deleteTarget ? `Delete ${deleteTarget.user.name}?` : ""}
                subtitle={
                    deleteTarget
                        ? `This removes the Grade ${deleteTarget.grade.name} coordinator account and its login. This cannot be undone.`
                        : undefined
                }
                confirmLabel={busy ? "Please wait..." : "Delete"}
                cancelLabel="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            <ResetPasswordDialog
                visible={!!resetTarget}
                accountLabel={resetTarget ? `Grade ${resetTarget.grade.name} Coordinator` : ""}
                onConfirm={confirmReset}
                onCancel={() => setResetTarget(null)}
            />
        </ScreenWrapper>
    );
}
