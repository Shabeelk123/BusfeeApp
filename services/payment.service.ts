import { supabase } from "../lib/supabase";
import { FeeStatus, FeeTransaction } from "../types/fee";

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

// ─── Fee Ledger (shared by StudentDetails + AddPaymentScreen) ─────────────────

export interface LedgerMonth {
    month: number;
    year: number;
    fee: number;
    paid_amount: number;
    status: FeeStatus;
    excluded: boolean;
    /** null when no student_monthly_fees row has been created for this month yet */
    smfId: string | null;
    transactions: FeeTransaction[];
}

/**
 * Build the student's full monthly fee ledger, one entry per month from
 * `joinDate` through the current month.
 *
 * Real months (a `student_monthly_fees` row already exists) come from
 * `getStudentFeeHistory`. Months with no row yet are filled in as virtual
 * "Pending" entries (fee = monthlyFee, paid = 0) so the ledger has no gaps —
 * collecting a payment against one creates the row on demand (see
 * `collectPayment`). Returned newest-first.
 */
export const getStudentFeeLedger = async (
    studentId: string,
    monthlyFee: number,
    joinDate: string
): Promise<{ data: LedgerMonth[]; error: any }> => {
    const { data: rows, error } = await getStudentFeeHistory(studentId);
    if (error) return { data: [], error };

    const rowMap = new Map<string, any>();
    (rows ?? []).forEach((r: any) => rowMap.set(`${r.month}-${r.year}`, r));

    const start = new Date(joinDate);
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), 1);

    const ledger: LedgerMonth[] = [];
    while (cursor <= end) {
        const row = rowMap.get(`${cursor.getMonth() + 1}-${cursor.getFullYear()}`);
        ledger.push({
            month: cursor.getMonth() + 1,
            year: cursor.getFullYear(),
            fee: row?.fee ?? monthlyFee,
            paid_amount: row?.paid_amount ?? 0,
            status: row?.status ?? "Pending",
            excluded: row?.excluded ?? false,
            smfId: row?.id ?? null,
            transactions: row?.fee_transactions ?? [],
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return { data: ledger.reverse(), error: null };
};

export interface LedgerSummary {
    totalPaid: number;
    outstanding: number;
    recentTransactions: (FeeTransaction & { month: number; year: number })[];
}

/**
 * Derive total paid, outstanding balance, and a flattened, most-recent-first
 * transaction list from a fee ledger. Shared by StudentDetails (Admin/CLASS)
 * and the Student dashboard so this math lives in exactly one place.
 */
export const summarizeLedger = (ledger: LedgerMonth[], recentLimit = 10): LedgerSummary => {
    let totalPaid = 0;
    let outstanding = 0;
    const transactions: (FeeTransaction & { month: number; year: number })[] = [];

    for (const m of ledger) {
        totalPaid += m.paid_amount;
        if (!m.excluded) outstanding += Math.max(0, m.fee - m.paid_amount);
        for (const t of m.transactions) {
            transactions.push({ ...t, month: m.month, year: m.year });
        }
    }

    transactions.sort((a, b) => (a.payment_date < b.payment_date ? 1 : -1));

    return { totalPaid, outstanding, recentTransactions: transactions.slice(0, recentLimit) };
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