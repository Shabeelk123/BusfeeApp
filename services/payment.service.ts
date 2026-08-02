import { supabase } from "../lib/supabase";
import { FeeStatus } from "../types/fee";

// ─── Fee Status ───────────────────────────────────────────────────────────────

/**
 * Get or create the student_monthly_fees record for a given student/month/year.
 * Returns the fee record with all transactions.
 */
export const getStudentMonthFee = async (
    studentId: string,
    month: number,
    year: number
) => {
    return await supabase
        .from("student_monthly_fees")
        .select(`
            id,
            student_id,
            month,
            year,
            fee,
            paid_amount,
            status,
            excluded,
            reason,
            fee_transactions (
                id,
                amount,
                payment_date,
                collected_by,
                remarks,
                created_at
            )
        `)
        .eq("student_id", studentId)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();
};

/**
 * Get all monthly fee records for a student.
 */
export const getStudentFeeHistory = async (studentId: string) => {
    return await supabase
        .from("student_monthly_fees")
        .select(`
            id,
            month,
            year,
            fee,
            paid_amount,
            status,
            excluded,
            reason,
            fee_transactions (
                id,
                amount,
                payment_date,
                remarks
            )
        `)
        .eq("student_id", studentId)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
};

// ─── Payment Collection ───────────────────────────────────────────────────────

/**
 * Record a payment for a student's monthly fee.
 *
 * Flow:
 *  1. Get or create the student_monthly_fees row.
 *  2. Insert a fee_transactions row.
 *  3. Update paid_amount and status on student_monthly_fees.
 */
export const collectPayment = async ({
    studentId,
    month,
    year,
    amount,
    remarks,
    collectedBy,
}: {
    studentId: string;
    month: number;
    year: number;
    amount: number;
    remarks?: string;
    collectedBy?: string;
}): Promise<{ data: any; error: any }> => {
    if (amount <= 0) {
        return { data: null, error: { message: "Amount must be greater than zero" } };
    }

    // ── Step 1: Get the monthly fee record ───────────────────────────────────
    const { data: existingSmf, error: fetchError } = await getStudentMonthFee(
        studentId,
        month,
        year
    );

    if (fetchError) return { data: null, error: fetchError };

    let smf = existingSmf as any;
    let smfId: string;

    if (!smf) {
        // Get the student's current monthly_fee
        const { data: student } = await supabase
            .from("students")
            .select("monthly_fee")
            .eq("id", studentId)
            .single();

        const fee = student?.monthly_fee ?? 0;

        const { data: newSmf, error: createError } = await supabase
            .from("student_monthly_fees")
            .insert([{ student_id: studentId, month, year, fee }])
            .select()
            .single();

        if (createError || !newSmf) return { data: null, error: createError };
        smf = newSmf;
    }

    smfId = smf.id;

    // ── Step 2: Insert fee_transaction row ───────────────────────────────────
    const { error: txError } = await supabase.from("fee_transactions").insert([{
        student_month_fee_id: smfId,
        amount,
        payment_date: new Date().toISOString().split("T")[0],
        collected_by: collectedBy ?? null,
        remarks: remarks ?? null,
    }]);

    if (txError) return { data: null, error: txError };

    // ── Step 3: Update paid_amount and status ────────────────────────────────
    const newPaid = (smf.paid_amount ?? 0) + amount;
    const fee     = smf.fee ?? 0;

    let status: FeeStatus = "Partial";
    if (newPaid >= fee)  status = "Paid";
    if (newPaid === 0)   status = "Pending";

    const { data: updated, error: updateError } = await supabase
        .from("student_monthly_fees")
        .update({ paid_amount: newPaid, status })
        .eq("id", smfId)
        .select()
        .single();

    return { data: updated, error: updateError };
};

// ─── Exclusion ────────────────────────────────────────────────────────────────

/**
 * Mark a student's month as excluded (e.g. absence, scholarship).
 */
export const excludeStudentMonth = async (
    studentId: string,
    month: number,
    year: number,
    reason: string
) => {
    const { data: existing } = await getStudentMonthFee(studentId, month, year);

    if (existing) {
        return await supabase
            .from("student_monthly_fees")
            .update({ status: "Excluded", excluded: true, reason })
            .eq("id", (existing as any).id);
    }

    const { data: student } = await supabase
        .from("students")
        .select("monthly_fee")
        .eq("id", studentId)
        .single();

    return await supabase.from("student_monthly_fees").insert([{
        student_id: studentId,
        month,
        year,
        fee: student?.monthly_fee ?? 0,
        status: "Excluded",
        excluded: true,
        reason,
    }]);
};