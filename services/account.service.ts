import { supabase } from "../lib/supabase";
import { ClassAccount, CoordinatorAccount } from "../types/grade";
import { getEdgeFunctionErrorMessage } from "../utils/edgeFunctionError";

// ─── Shared Account Management ─────────────────────────────────────────────────
// Class Accounts and Coordinator Accounts are the same underlying concept
// (a login tied to a grade, optionally a division) — this section holds the
// logic that's genuinely identical between them so neither screen re-implements it.

type AccountType = "CLASS" | "COORDINATOR";

/**
 * Reset an account's password via the `reset-account-password` Edge
 * Function. ADMIN-only; the new password is set directly on the linked
 * Supabase Auth user and is never generated or stored in the database.
 * Shared by both Class and Coordinator accounts — only the target table
 * differs, which the Edge Function switches on via `accountType`.
 */
const resetAccountPassword = async (
    accountType: AccountType,
    accountId: string,
    newPassword: string
): Promise<{ error: any }> => {
    const { data, error } = await supabase.functions.invoke("reset-account-password", {
        body: { accountType, accountId, newPassword },
    });

    if (error) {
        return { error: { message: await getEdgeFunctionErrorMessage(error, "Failed to reset password") } };
    }

    if (data?.success === false) {
        return { error: { message: data.error || "Failed to reset password" } };
    }

    return { error: null };
};

/**
 * Enable or disable an account's login access.
 *
 * Placeholder: no `status`/`disabled` column exists on `users` yet and no
 * Edge Function has been built. This stub keeps both account screens wired
 * up so the toggle can be enabled once that infrastructure ships.
 */
const setAccountStatus = async (
    accountType: AccountType,
    accountId: string,
    enabled: boolean
): Promise<{ error: any }> => {
    console.warn(
        `[account.service] setAccountStatus(${accountType}): account status Edge Function not implemented yet.`
    );
    return {
        error: { message: "Enable/disable isn't available yet — coming soon." },
    };
};

/**
 * Delete an account (Auth user + users row + account row).
 *
 * Placeholder: no `delete-account` Edge Function has been built yet (only
 * `create-coordinator`, `create-grade`, `delete-grade`, `delete-student` and
 * `reset-account-password` exist). This stub keeps the Delete action wired
 * up in the UI so it can be enabled once that function ships.
 */
const deleteAccount = async (
    accountType: AccountType,
    accountId: string
): Promise<{ error: any }> => {
    console.warn(
        `[account.service] deleteAccount(${accountType}): delete Edge Function not implemented yet.`
    );
    return {
        error: { message: "Delete isn't available yet — coming soon." },
    };
};

// ─── Class Accounts ───────────────────────────────────────────────────────────

/**
 * Fetch all class accounts with grade and division names joined.
 * Returns all 51 accounts (grades 8-10, divisions A-Q).
 */
export const getClassAccounts = async (): Promise<{
    data: (ClassAccount & {
        grade: { id: string; name: string };
        division: { id: string; name: string };
    })[];
    error: any;
}> => {
    const { data, error } = await supabase
        .from("class_accounts")
        .select(`
            id,
            user_id,
            grade_id,
            division_id,
            created_at,
            grade:grades(id, name),
            division:divisions(id, name)
        `)
        .order("grade_id, division_id");

    return { data: (data as any) ?? [], error };
};

/**
 * Fetch the class account linked to a specific auth user.
 * Used immediately after login to hydrate CLASS role context.
 */
export const getClassAccountByUser = async (
    authUserId: string
): Promise<{
    data: (ClassAccount & {
        grade: { id: string; name: string };
        division: { id: string; name: string };
    }) | null;
    error: any;
}> => {
    const { data, error } = await supabase
        .from("class_accounts")
        .select(`
            id,
            user_id,
            grade_id,
            division_id,
            created_at,
            grade:grades(id, name),
            division:divisions(id, name)
        `)
        .eq("user_id", authUserId)
        .single();

    return { data: (data as any) ?? null, error };
};

/**
 * Fetch the class account (grade + division) for the currently signed-in
 * auth user. Used by the CLASS module to scope every query (students,
 * defaulters, student creation) to the logged-in account's own class.
 */
export const getCurrentClassAccount = async (): Promise<{
    data: (ClassAccount & {
        grade: { id: string; name: string };
        division: { id: string; name: string };
    }) | null;
    error: any;
}> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    if (!authUser) return { data: null, error: { message: "Not signed in" } };

    return getClassAccountByUser(authUser.id);
};

/**
 * Compute a class account's login email deterministically, matching the
 * `create-grade` Edge Function's convention (`${gradeName}${divisionName}@school.com`).
 * `users`/`class_accounts` do not store email, so it is derived rather than fetched.
 */
export const getClassAccountLoginId = (gradeName: string, divisionName: string): string => {
    return `${gradeName}${divisionName}@school.com`;
};

/** Reset a class account's password. See {@link resetAccountPassword}. */
export const resetClassAccountPassword = (accountId: string, newPassword: string) =>
    resetAccountPassword("CLASS", accountId, newPassword);

/** Enable or disable a class account's login access. See {@link setAccountStatus}. */
export const setClassAccountStatus = (accountId: string, enabled: boolean) =>
    setAccountStatus("CLASS", accountId, enabled);

// ─── Coordinator Accounts ─────────────────────────────────────────────────────

/**
 * Fetch all coordinator accounts with grade name and coordinator name joined.
 * Returns at most one account per grade (8, 9, 10).
 */
export const getCoordinatorAccounts = async (): Promise<{
    data: (CoordinatorAccount & {
        grade: { id: string; name: string };
        user: { name: string };
    })[];
    error: any;
}> => {
    const { data, error } = await supabase
        .from("coordinator_accounts")
        .select(`
            id,
            user_id,
            grade_id,
            created_at,
            grade:grades(id, name),
            user:users(name)
        `)
        .order("grade_id");

    return { data: (data as any) ?? [], error };
};

/**
 * Fetch the coordinator account linked to a specific auth user.
 * Used immediately after login to hydrate COORDINATOR role context.
 */
export const getCoordinatorAccountByUser = async (
    authUserId: string
): Promise<{
    data: (CoordinatorAccount & { grade: { id: string; name: string } }) | null;
    error: any;
}> => {
    const { data, error } = await supabase
        .from("coordinator_accounts")
        .select(`
            id,
            user_id,
            grade_id,
            created_at,
            grade:grades(id, name)
        `)
        .eq("user_id", authUserId)
        .single();

    return { data: (data as any) ?? null, error };
};

/**
 * Fetch the coordinator account (grade) for the currently signed-in auth
 * user. Used by the COORDINATOR module to scope every query (dashboard,
 * students, reports, defaulters) to the logged-in account's own grade.
 */
export const getCurrentCoordinatorAccount = async (): Promise<{
    data: (CoordinatorAccount & { grade: { id: string; name: string } }) | null;
    error: any;
}> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    if (!authUser) return { data: null, error: { message: "Not signed in" } };

    return getCoordinatorAccountByUser(authUser.id);
};

/**
 * Compute a coordinator account's login email deterministically, matching
 * the `create-coordinator` Edge Function's convention (`coordinator${gradeName}@school.com`).
 * `users`/`coordinator_accounts` do not store email, so it is derived rather than fetched.
 */
export const getCoordinatorAccountLoginId = (gradeName: string): string => {
    return `coordinator${gradeName}@school.com`;
};

/**
 * Create a coordinator account via the `create-coordinator` Edge Function.
 * ADMIN-only. The ADMIN supplies the password directly — it is never
 * generated. Fails with a 409 if the grade already has a coordinator.
 */
export const createCoordinator = async ({
    gradeId,
    coordinatorName,
    password,
}: {
    gradeId: string;
    coordinatorName: string;
    password: string;
}): Promise<{ data: { grade: string; name: string; email: string } | null; error: any }> => {
    const { data, error } = await supabase.functions.invoke("create-coordinator", {
        body: { gradeId, coordinatorName, password },
    });

    if (error) {
        return { data: null, error: { message: await getEdgeFunctionErrorMessage(error, "Failed to create coordinator") } };
    }

    if (data?.success === false) {
        return { data: null, error: { message: data.error || "Failed to create coordinator" } };
    }

    return { data: data?.account ?? null, error: null };
};

/** Reset a coordinator account's password. See {@link resetAccountPassword}. */
export const resetCoordinatorAccountPassword = (accountId: string, newPassword: string) =>
    resetAccountPassword("COORDINATOR", accountId, newPassword);

/** Enable or disable a coordinator account's login access. See {@link setAccountStatus}. */
export const setCoordinatorAccountStatus = (accountId: string, enabled: boolean) =>
    setAccountStatus("COORDINATOR", accountId, enabled);

/** Delete a coordinator account. See {@link deleteAccount}. */
export const deleteCoordinatorAccount = (accountId: string) =>
    deleteAccount("COORDINATOR", accountId);
