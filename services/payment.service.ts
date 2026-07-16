import { supabase } from "../lib/supabase";
import { buildMonthLedger, calcAdvanceFromLedger, MonthEntry } from "../utils/monthlyFeeStatus";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeeStatusResult {
    studentId: string;
    studentName: string;
    monthlyFee: number;
    effectiveFrom: string;
    feeAssignmentId: string | null;
    transactions: {
        id: string;
        amount: number;
        payment_month: number;
        payment_year: number;
        note?: string;
        created_at: string;
    }[];
    /** Full chronological ledger from effective_from to today */
    months: MonthEntry[];
    /** Oldest month that is still PENDING or PARTIAL, or null if all paid / in advance */
    oldestPendingMonth: { month: number; year: number; remaining: number } | null;
    /** Total rupees still owed across all months */
    totalOutstanding: number;
    /** Advance credit if student has overpaid */
    advanceBalance: number;
}

export interface PaymentAllocation {
    month: number;
    year: number;
    amount: number;
    /** true = this allocation fully settles the month */
    fullyCovered: boolean;
}

export interface CollectPaymentResult {
    allocations: PaymentAllocation[];
    advanceAdded: number;
    error?: string;
}

// ─── getStudentFeeStatus ──────────────────────────────────────────────────────

/**
 * Returns a complete fee picture for a student:
 *   - month-by-month ledger
 *   - oldest unpaid month
 *   - total outstanding
 * This is called by the payment screen on load.
 */
export const getStudentFeeStatus = async (
    studentId: string
): Promise<{ data: FeeStatusResult | null; error: any }> => {
    const { data: student, error } = await supabase
        .from("students")
        .select(`
            id,
            full_name,
            created_at,
            student_fee_assignments (
                id,
                monthly_fee,
                effective_from
            ),
            fee_transactions (
                id,
                amount,
                payment_month,
                payment_year,
                note,
                created_at
            )
        `)
        .eq("id", studentId)
        .single();

    if (error || !student) {
        return { data: null, error };
    }

    const assignment = (student as any).student_fee_assignments?.[0];
    const monthlyFee = Number(assignment?.monthly_fee || 0);
    const effectiveFrom: string = assignment?.effective_from || (student as any).created_at;

    const transactions: any[] = (student as any).fee_transactions || [];

    // Build ledger up to current month
    const months = buildMonthLedger({
        monthlyFee,
        effectiveFrom,
        joinDate: (student as any).created_at,
        transactions,
    });

    // Oldest pending / partial month
    const pendingEntry = months.find((m) => m.status !== "PAID");
    const oldestPendingMonth = pendingEntry
        ? {
              month: pendingEntry.month,
              year: pendingEntry.year,
              remaining: pendingEntry.expected - pendingEntry.paid,
          }
        : null;

    const totalOutstanding = months.reduce(
        (sum, m) => sum + Math.max(0, m.expected - m.paid),
        0
    );

    const totalPaid = transactions.reduce((s, t) => s + Number(t.amount), 0);
    const advanceBalance = calcAdvanceFromLedger(months, totalPaid);

    return {
        data: {
            studentId,
            studentName: (student as any).full_name,
            monthlyFee,
            effectiveFrom,
            feeAssignmentId: assignment?.id ?? null,
            transactions,
            months,
            oldestPendingMonth,
            totalOutstanding,
            advanceBalance,
        },
        error: null,
    };
};

// ─── collectPayment ────────────────────────────────────────────────────────────

/**
 * Waterfall payment allocation engine.
 *
 * Algorithm:
 *  1. Fetch the current fee status (ledger)
 *  2. If overrideMonth/Year supplied, start waterfall from that month.
 *     Otherwise start from the oldest pending/partial month.
 *  3. Iterate chronologically, greedily filling each month:
 *       – remaining_needed = monthly_fee - already_paid_this_month
 *       – deduct from amount, record allocation
 *  4. If amount exceeds all unpaid months, apply surplus to future months
 *     (advance payments up to 12 months ahead).
 *  5. Insert one `fee_transactions` row per allocated month.
 *  6. Returns allocation breakdown for the UI confirmation card.
 */
export const collectPayment = async ({
    studentId,
    amount,
    overrideMonth,
    overrideYear,
    note,
}: {
    studentId: string;
    amount: number;
    overrideMonth?: number;
    overrideYear?: number;
    note?: string;
}): Promise<CollectPaymentResult> => {
    if (amount <= 0) {
        return { allocations: [], advanceAdded: 0, error: "Amount must be greater than zero." };
    }

    // ── Fetch current state ──────────────────────────────────────────────────
    const { data: status, error: fetchErr } = await getStudentFeeStatus(studentId);
    if (fetchErr || !status) {
        return { allocations: [], advanceAdded: 0, error: fetchErr?.message || "Could not fetch student fee status." };
    }

    const { monthlyFee, effectiveFrom, transactions } = status;

    // ── Build ledger that includes 12 future months for advance payments ─────
    const today = new Date();
    const futureEnd = new Date(today.getFullYear(), today.getMonth() + 12, 1);
    const fullLedger = buildMonthLedger({
        monthlyFee,
        effectiveFrom,
        joinDate: status.effectiveFrom,
        transactions,
        untilDate: futureEnd,
    });

    // ── Find starting month ──────────────────────────────────────────────────
    let startIndex = 0;
    if (overrideMonth && overrideYear) {
        const idx = fullLedger.findIndex(
            (m) => m.month === overrideMonth && m.year === overrideYear
        );
        if (idx >= 0) startIndex = idx;
    } else {
        // Oldest pending or partial
        const idx = fullLedger.findIndex((m) => m.status !== "PAID");
        startIndex = idx >= 0 ? idx : fullLedger.length; // all paid → will become advance
    }

    // ── Waterfall allocation ─────────────────────────────────────────────────
    const allocations: PaymentAllocation[] = [];
    let remaining = amount;

    for (let i = startIndex; i < fullLedger.length && remaining > 0; i++) {
        const entry = fullLedger[i];
        const alreadyPaid = entry.paid;
        const needed = entry.expected - alreadyPaid;

        if (needed <= 0) continue; // already fully paid

        const give = Math.min(remaining, needed);
        remaining -= give;

        allocations.push({
            month: entry.month,
            year: entry.year,
            amount: give,
            fullyCovered: give >= needed,
        });
    }

    // Leftover = advance (went past all months in the ledger)
    const advanceAdded = remaining;

    // ── Insert fee_transactions rows ─────────────────────────────────────────
    if (allocations.length === 0 && advanceAdded > 0) {
        // Entire amount is advance — record as the next future month
        const nextFutureEntry = fullLedger.find(
            (m, i) => i >= startIndex && fullLedger[i].paid === 0
        );
        const targetMonth = nextFutureEntry
            ? { month: nextFutureEntry.month, year: nextFutureEntry.year }
            : {
                  month: (today.getMonth() + 2 > 12 ? 1 : today.getMonth() + 2),
                  year: (today.getMonth() + 2 > 12 ? today.getFullYear() + 1 : today.getFullYear()),
              };

        const { error: insertErr } = await supabase.from("fee_transactions").insert([{
            student_id: studentId,
            amount,
            payment_month: targetMonth.month,
            payment_year: targetMonth.year,
            note: note || null,
        }]);

        if (insertErr) {
            return { allocations: [], advanceAdded: 0, error: insertErr.message };
        }

        return {
            allocations: [{ month: targetMonth.month, year: targetMonth.year, amount, fullyCovered: false }],
            advanceAdded: amount,
        };
    }

    // Build insert payload for each allocation
    const rows = allocations.map((alloc, idx) => ({
        student_id: studentId,
        amount: alloc.amount,
        payment_month: alloc.month,
        payment_year: alloc.year,
        // Only attach the note to the first row to avoid duplication
        note: idx === 0 ? (note || null) : null,
    }));

    const { error: insertErr } = await supabase.from("fee_transactions").insert(rows);
    if (insertErr) {
        return { allocations: [], advanceAdded: 0, error: insertErr.message };
    }

    return { allocations, advanceAdded };
};

// ─── Legacy single-insert kept for backward compat (teacher payment screen) ──

interface AddPaymentPayload {
    student_id: string;
    amount: number;
    payment_month: number;
    payment_year: number;
    note?: string;
}

export const addPayment = async ({
    student_id,
    amount,
    payment_month,
    payment_year,
    note,
}: AddPaymentPayload) => {
    return await supabase
        .from("fee_transactions")
        .insert([{ student_id, amount, payment_month, payment_year, note }]);
};