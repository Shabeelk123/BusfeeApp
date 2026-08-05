import { useCallback, useState } from "react";

import { useToast } from "../components/common/ToastContext";

interface AccountLike {
    id: string;
    enabled: boolean;
}

interface UseAccountActionsArgs<T extends AccountLike> {
    /** Human-readable label for toasts, e.g. "Grade 8-A" or "Grade 8 Coordinator" */
    entityLabel: (row: T) => string;
    resetPassword: (accountId: string, newPassword: string) => Promise<{ error: any }>;
    setStatus: (accountId: string, enabled: boolean) => Promise<{ error: any }>;
    deleteAccount?: (accountId: string) => Promise<{ error: any }>;
    /** Called after any action succeeds, so the caller can refetch its list */
    onChanged: () => void;
}

/**
 * Shared Reset Password / Enable-Disable / Delete confirmation flow for both
 * Class Accounts and Coordinator Accounts — the two screens only differ in
 * which service functions they pass in.
 */
export function useAccountActions<T extends AccountLike>({
    entityLabel,
    resetPassword,
    setStatus,
    deleteAccount,
    onChanged,
}: UseAccountActionsArgs<T>) {
    const toast = useToast();

    const [toggleTarget, setToggleTarget] = useState<T | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
    const [resetTarget, setResetTarget] = useState<T | null>(null);
    const [busy, setBusy] = useState(false);

    const confirmToggle = useCallback(async () => {
        if (!toggleTarget) return;
        try {
            setBusy(true);
            const nextEnabled = !toggleTarget.enabled;
            const { error } = await setStatus(toggleTarget.id, nextEnabled);
            if (error) {
                toast.info("Not Available", error.message);
            } else {
                toast.success("Updated", `Account ${nextEnabled ? "enabled" : "disabled"}`);
                onChanged();
            }
        } finally {
            setBusy(false);
            setToggleTarget(null);
        }
    }, [toggleTarget, setStatus, toast, onChanged]);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget || !deleteAccount) return;
        try {
            setBusy(true);
            const { error } = await deleteAccount(deleteTarget.id);
            if (error) {
                toast.info("Not Available", error.message);
            } else {
                toast.success("Deleted", `${entityLabel(deleteTarget)} removed`);
                onChanged();
            }
        } finally {
            setBusy(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, deleteAccount, toast, onChanged, entityLabel]);

    const confirmReset = useCallback(
        async (newPassword: string) => {
            if (!resetTarget) return;
            const { error } = await resetPassword(resetTarget.id, newPassword);
            if (error) return { error };
            toast.success("Password Reset", `New password set for ${entityLabel(resetTarget)}`);
            setResetTarget(null);
        },
        [resetTarget, resetPassword, toast, entityLabel],
    );

    return {
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
    };
}
