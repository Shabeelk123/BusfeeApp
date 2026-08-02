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
