import { supabase } from "../lib/supabase";

/**
 * Returns students who have any outstanding balance (Pending or Partial)
 * for a given month/year, filtered by grade/division if provided.
 *
 * V2: queries student_monthly_fees directly — no computed ledger needed.
 *
 * The grade/division filter is applied server-side via a `!inner` join on
 * `students`, not fetched-then-filtered client-side. Fetching every school's
 * defaulters and filtering in JS would leak every other class's student
 * names and dues over the network to a CLASS/COORDINATOR client, visible to
 * anyone inspecting the app's traffic — regardless of what the UI displays.
 */
export const getCurrentMonthDefaulters = async ({
    gradeId,
    divisionId,
}: {
    gradeId?: string;
    divisionId?: string;
} = {}) => {
    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();

    let query = supabase
        .from("student_monthly_fees")
        .select(`
            id,
            month,
            year,
            fee,
            paid_amount,
            status,
            student:students!inner (
                id,
                name,
                admission_no,
                grade_id,
                division_id,
                monthly_fee,
                grade:grades(id, name),
                division:divisions(id, name)
            )
        `)
        .in("status", ["Pending", "Partial"])
        .eq("month", currentMonth)
        .eq("year", currentYear);

    if (gradeId) {
        query = query.eq("student.grade_id", gradeId);
    }

    if (divisionId) {
        query = query.eq("student.division_id", divisionId);
    }

    const { data, error } = await query;

    if (error) return { data: [], error };

    return { data: (data as any[]) ?? [], error: null };
};