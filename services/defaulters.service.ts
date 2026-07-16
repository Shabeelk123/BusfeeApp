import { supabase } from "../lib/supabase";
import { buildMonthLedger } from "../utils/monthlyFeeStatus";

/**
 * Returns students who have any outstanding balance for the current month
 * (or any prior unpaid month), respecting each student's effective_from date.
 *
 * A student is a "defaulter" if:
 *   - Their effective_from date is on or before the current month, AND
 *   - They have an unpaid/partially-paid month anywhere in their ledger
 */
export const getCurrentMonthDefaulters = async ({
    selectedClass = "ALL",
}: {
    selectedClass?: string;
}) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // ── Fetch students with fee assignments and all transactions ──────────────
    let query = supabase
        .from("students")
        .select(`
            id,
            full_name,
            class_name,
            phone,
            created_at,
            student_fee_assignments (
                monthly_fee,
                effective_from
            ),
            fee_transactions (
                amount,
                payment_month,
                payment_year
            )
        `);

    if (selectedClass !== "ALL") {
        query = query.eq("class_name", selectedClass);
    }

    const { data: students, error: studentsError } = await query;

    if (studentsError) {
        return { data: [], error: studentsError };
    }

    const defaulters: any[] = [];

    for (const student of students || []) {
        const s = student as any;
        const assignment = s.student_fee_assignments?.[0];
        if (!assignment) continue;

        const monthlyFee = Number(assignment.monthly_fee || 0);
        if (monthlyFee <= 0) continue;

        const effectiveFrom: string = assignment.effective_from || s.created_at;
        const transactions: any[] = s.fee_transactions || [];

        // Build ledger from effective_from to current month
        const ledger = buildMonthLedger({
            monthlyFee,
            effectiveFrom,
            joinDate: s.created_at,
            transactions,
        });

        // Calculate totals
        const totalPaid = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalDue = ledger.reduce((sum, e) => sum + Math.max(0, e.expected - e.paid), 0);

        if (totalDue <= 0) continue; // No outstanding balance

        // Find the oldest unpaid month for display
        const oldestUnpaid = ledger.find((m) => m.status !== "PAID");

        // Find this current month's specific status
        const currentMonthEntry = ledger.find(
            (m) => m.month === currentMonth && m.year === currentYear
        );

        defaulters.push({
            ...s,
            monthlyFee,
            paid: totalPaid,
            pending: totalDue,
            oldestUnpaidMonth: oldestUnpaid
                ? { month: oldestUnpaid.month, year: oldestUnpaid.year }
                : null,
            currentMonthPaid: currentMonthEntry?.paid || 0,
            currentMonthStatus: currentMonthEntry?.status || "PENDING",
        });
    }

    return {
        data: defaulters,
        error: null,
    };
};