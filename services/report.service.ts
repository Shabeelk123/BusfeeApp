import { supabase } from "../lib/supabase";

export interface ReportStudentRow {
    id: string;
    admission_no: string;
    name: string;
    grade_id: string;
    division_id: string;
    monthly_fee: number;
    grade?: { id: string; name: string };
    division?: { id: string; name: string };
    /** This month's fee/paid_amount/status — from student_monthly_fees, or a
     *  virtual Pending entry (fee = monthly_fee, paid = 0) if no row exists yet. */
    fee: number;
    paid_amount: number;
    status: string;
}

/**
 * Fetch every student (optionally scoped to a grade/division) alongside
 * their student_monthly_fees row for the given month/year — the same
 * virtual-month convention as payment.service.ts::getStudentFeeLedger.
 */
export const getReportData = async ({
    gradeId,
    divisionId,
    month,
    year,
}: {
    gradeId?: string;
    divisionId?: string;
    month: number;
    year: number;
}): Promise<{ data: ReportStudentRow[] | null; error: any }> => {
    let studentsQuery = supabase
        .from("students")
        .select("id, admission_no, name, grade_id, division_id, monthly_fee, grade:grades(id,name), division:divisions(id,name)")
        .order("name", { ascending: true });

    if (gradeId) studentsQuery = studentsQuery.eq("grade_id", gradeId);
    if (divisionId) studentsQuery = studentsQuery.eq("division_id", divisionId);

    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) return { data: null, error: studentsError };

    const { data: monthlyFees, error: feesError } = await supabase
        .from("student_monthly_fees")
        .select("student_id, fee, paid_amount, status")
        .eq("month", month)
        .eq("year", year);

    if (feesError) return { data: null, error: feesError };

    const feeMap = new Map((monthlyFees ?? []).map((f: any) => [f.student_id, f]));

    const data = (students ?? []).map((s: any) => {
        const smf = feeMap.get(s.id);
        return {
            ...s,
            fee: smf?.fee ?? s.monthly_fee ?? 0,
            paid_amount: smf?.paid_amount ?? 0,
            status: smf?.status ?? "Pending",
        };
    });

    return { data, error: null };
};
