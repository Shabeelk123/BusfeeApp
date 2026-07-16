import { supabase } from "../lib/supabase";
import { buildMonthLedger } from "../utils/monthlyFeeStatus";

export const getDashboardStats = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // ── Total students ────────────────────────────────────────────────────────
    const { count: totalStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

    // ── Total teachers ────────────────────────────────────────────────────────
    const { count: totalTeachers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "TEACHER");

    // ── Monthly collection: sum of all transactions recorded for current month ─
    const { data: currentMonthTxns } = await supabase
        .from("fee_transactions")
        .select("amount")
        .eq("payment_month", month)
        .eq("payment_year", year);

    const monthlyCollection =
        currentMonthTxns?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    // ── Pending amount: true outstanding across all students ──────────────────
    // Fetch every student with their fee assignment + all transactions.
    // Run the waterfall ledger per student and sum up unpaid amounts.
    // This is the accurate figure — it correctly accounts for partial payments
    // and students who haven't started incurring dues yet (effective_from).
    const { data: students } = await supabase
        .from("students")
        .select(`
            id,
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

    let pendingAmount = 0;

    for (const student of students || []) {
        const s = student as any;
        const assignment = s.student_fee_assignments?.[0];
        if (!assignment) continue;

        const monthlyFee = Number(assignment.monthly_fee || 0);
        const effectiveFrom: string = assignment.effective_from || s.created_at;
        const transactions: any[] = s.fee_transactions || [];

        const ledger = buildMonthLedger({
            monthlyFee,
            effectiveFrom,
            joinDate: s.created_at,
            transactions,
        });

        // Sum up the unpaid portion of each month in the ledger
        for (const entry of ledger) {
            const outstanding = entry.expected - entry.paid;
            if (outstanding > 0) pendingAmount += outstanding;
        }
    }

    return {
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        monthlyCollection,
        pendingAmount,
    };
};