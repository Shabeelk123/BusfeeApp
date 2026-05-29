import { supabase } from "../lib/supabase";

export const getDashboardStats =
    async () => {
        const now =
            new Date();

        const month =
            now.getMonth() + 1;

        const year =
            now.getFullYear();

        // Total students
        const {
            count: totalStudents,
        } = await supabase
            .from("students")
            .select("*", {
                count: "exact",
                head: true,
            });

        // Total teachers
        const {
            count: totalTeachers,
        } = await supabase
            .from("users")
            .select("*", {
                count: "exact",
                head: true,
            })
            .eq(
                "role",
                "TEACHER"
            );

        // Current month payments
        const {
            data: transactions,
        } = await supabase
            .from(
                "fee_transactions"
            )
            .select("amount")
            .eq(
                "payment_month",
                month
            )
            .eq(
                "payment_year",
                year
            );

        // Monthly collection
        const monthlyCollection =
            transactions?.reduce(
                (
                    sum,
                    item
                ) =>
                    sum +
                    Number(
                        item.amount
                    ),
                0
            ) || 0;

        // Defaulters count
        const {
            data: students,
        } = await supabase
            .from("students")
            .select(`
                id,

                student_fee_assignments (
                    monthly_fee
                )
            `);

        const pendingAmount =
            students?.reduce(
                (
                    total: number,
                    student: any
                ) => {
                    const fee =
                        Number(
                            student
                                ?.student_fee_assignments?.[0]
                                ?.monthly_fee || 0
                        );

                    return (
                        total +
                        fee
                    );
                },
                0
            ) || 0;

        return {
            totalStudents:
                totalStudents || 0,

            totalTeachers:
                totalTeachers || 0,

            monthlyCollection,

            pendingAmount,
        };
    };