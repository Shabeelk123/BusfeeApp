import { supabase } from "../lib/supabase";

/**
 * Returns students who have any outstanding balance (Pending or Partial)
 * for a given month/year, filtered by grade/division if provided.
 *
 * V2: queries student_monthly_fees directly — no computed ledger needed.
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
            student:students (
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

    const { data, error } = await query;

    if (error) return { data: [], error };

    // Apply grade/division filters on joined student data
    let results = (data as any[]) ?? [];

    if (gradeId) {
        results = results.filter((r: any) => r.student?.grade_id === gradeId);
    }

    if (divisionId) {
        results = results.filter((r: any) => r.student?.division_id === divisionId);
    }

    return { data: results, error: null };
};