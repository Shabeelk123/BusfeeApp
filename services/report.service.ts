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
 * Fetch students (optionally scoped to a grade/division and/or a name/
 * admission-no search) alongside their student_monthly_fees row for the
 * given month/year — the same virtual-month convention as
 * payment.service.ts::getStudentFeeLedger.
 *
 * `page`/`limit` are optional — omit both to fetch every matching student in
 * one go (used by CLASS/Admin dashboards and Reports, which need whole-scope
 * totals). Pass both to paginate (used by the Admin Students list, which can
 * run to 1000+ students and needs infinite-scroll rather than one big fetch).
 */
export const getReportData = async ({
    gradeId,
    divisionId,
    month,
    year,
    search,
    page,
    limit,
}: {
    gradeId?: string;
    divisionId?: string;
    month: number;
    year: number;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: ReportStudentRow[] | null; error: any }> => {
    let studentsQuery = supabase
        .from("students")
        .select("id, admission_no, name, grade_id, division_id, monthly_fee, grade:grades(id,name), division:divisions(id,name)")
        .order("name", { ascending: true });

    if (gradeId) studentsQuery = studentsQuery.eq("grade_id", gradeId);
    if (divisionId) studentsQuery = studentsQuery.eq("division_id", divisionId);
    if (search && search.trim()) {
        studentsQuery = studentsQuery.or(`name.ilike.%${search}%,admission_no.ilike.%${search}%`);
    }

    const paginating = page !== undefined && limit !== undefined;
    if (paginating) {
        const from = page! * limit!;
        const to = from + limit! - 1;
        studentsQuery = studentsQuery.range(from, to);
    }

    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) return { data: null, error: studentsError };

    if (paginating && (students ?? []).length === 0) {
        return { data: [], error: null };
    }

    let feesQuery = supabase
        .from("student_monthly_fees")
        .select("student_id, fee, paid_amount, status")
        .eq("month", month)
        .eq("year", year);

    // When paginating, only pull fee rows for the students on this page —
    // fetching all 1000+ students' monthly fees for a 20-row page would defeat
    // the point of paginating.
    if (paginating) {
        feesQuery = feesQuery.in("student_id", (students ?? []).map((s: any) => s.id));
    }

    const { data: monthlyFees, error: feesError } = await feesQuery;
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
