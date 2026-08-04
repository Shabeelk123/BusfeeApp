import { supabase } from "../lib/supabase";
import { ClassAccount, CoordinatorAccount } from "../types/grade";

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

/**
 * Reset a class account's password.
 *
 * Placeholder: the `reset-class-account-password` Edge Function has not
 * been built yet. This stub keeps the Class Accounts screen wired up
 * so the button can be enabled the moment that function ships.
 */
export const resetClassAccountPassword = async (
    accountId: string
): Promise<{ error: any }> => {
    console.warn(
        "[account.service] resetClassAccountPassword: reset-class-account-password Edge Function not implemented yet."
    );
    return {
        error: { message: "Password reset isn't available yet — coming soon." },
    };
};

/**
 * Enable or disable a class account's login access.
 *
 * Placeholder: no `status`/`disabled` column exists on `users` yet and no
 * Edge Function has been built. This stub keeps the Class Accounts screen
 * wired up so the toggle can be enabled once that infrastructure ships.
 */
export const setClassAccountStatus = async (
    accountId: string,
    enabled: boolean
): Promise<{ error: any }> => {
    console.warn(
        "[account.service] setClassAccountStatus: account status Edge Function not implemented yet."
    );
    return {
        error: { message: "Enable/disable isn't available yet — coming soon." },
    };
};

// ─── Coordinator Accounts ─────────────────────────────────────────────────────

/**
 * Fetch all coordinator accounts with grade name joined.
 * Returns 3 accounts (one per grade: 8, 9, 10).
 */
export const getCoordinatorAccounts = async (): Promise<{
    data: (CoordinatorAccount & { grade: { id: string; name: string } })[];
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
