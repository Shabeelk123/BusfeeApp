import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";

import AccountCard from "@/components/accounts/AccountCard";
import ResetPasswordDialog from "@/components/accounts/ResetPasswordDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { useAccountActions } from "@/hooks/useAccountActions";
import {
    getClassAccountLoginId,
    getClassAccounts,
    resetClassAccountPassword,
    setClassAccountStatus,
} from "@/services/account.service";
import { ClassAccount } from "@/types/grade";

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

type Row = ClassAccount & {
    grade: { id: string; name: string };
    division: { id: string; name: string };
    enabled: boolean;
};

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ClassAccountsScreen() {
    const [accounts, setAccounts] = useState<Row[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    const {
        toggleTarget,
        setToggleTarget,
        resetTarget,
        setResetTarget,
        busy,
        confirmToggle,
        confirmReset,
    } = useAccountActions<Row>({
        entityLabel: (row) => `${row.grade.name}-${row.division.name}`,
        resetPassword: resetClassAccountPassword,
        setStatus: setClassAccountStatus,
        onChanged: fetchAccounts,
    });

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

    return (
        <ScreenWrapper backgroundColor={T.background}>
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
                    placeholder="Search by grade, division or login ID..."
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
                        badgeLabel={`${item.grade.name}${item.division.name}`}
                        title={`Grade ${item.grade.name} · Division ${item.division.name}`}
                        loginId={getClassAccountLoginId(item.grade.name, item.division.name)}
                        enabled={item.enabled}
                        onReset={() => setResetTarget(item)}
                        onToggle={() => setToggleTarget(item)}
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
                        ? `${toggleTarget.enabled ? "Disable" : "Enable"} ${toggleTarget.grade.name}-${toggleTarget.division.name}?`
                        : ""
                }
                subtitle="This account's ability to sign in will change immediately."
                confirmLabel={busy ? "Please wait..." : "Confirm"}
                cancelLabel="Cancel"
                onConfirm={confirmToggle}
                onCancel={() => setToggleTarget(null)}
            />

            <ResetPasswordDialog
                visible={!!resetTarget}
                accountLabel={resetTarget ? `${resetTarget.grade.name}-${resetTarget.division.name}` : ""}
                onConfirm={confirmReset}
                onCancel={() => setResetTarget(null)}
            />
        </ScreenWrapper>
    );
}
