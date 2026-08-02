import { supabase } from "../lib/supabase";

/**
 * Dashboard statistics for the admin home screen (V2).
 */
export const getDashboardStats = async () => {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    // Total students
    const { count: totalStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

    // Monthly collection: sum of all fee_transactions this month
    // V2: join through student_monthly_fees to get the month/year
    const { data: currentMonthFees } = await supabase
        .from("student_monthly_fees")
        .select("paid_amount")
        .eq("month", month)
        .eq("year", year);

    const monthlyCollection =
        currentMonthFees?.reduce((sum, r) => sum + Number(r.paid_amount), 0) ?? 0;

    // Pending amount: sum of (fee - paid_amount) where status is Pending or Partial
    const { data: pendingFees } = await supabase
        .from("student_monthly_fees")
        .select("fee, paid_amount")
        .in("status", ["Pending", "Partial"]);

    const pendingAmount =
        pendingFees?.reduce(
            (sum, r) => sum + Math.max(0, Number(r.fee) - Number(r.paid_amount)),
            0
        ) ?? 0;

    // Total class accounts (replaces "totalTeachers")
    const { count: totalClassAccounts } = await supabase
        .from("class_accounts")
        .select("*", { count: "exact", head: true });

    return {
        totalStudents:    totalStudents    ?? 0,
        totalClassAccounts: totalClassAccounts ?? 0,
        monthlyCollection,
        pendingAmount,
    };
};