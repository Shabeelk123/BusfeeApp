import { supabase } from "../lib/supabase";

export const getCurrentMonthDefaulters =
    async ({
        selectedClass = "ALL",
    }: {
        selectedClass?: string;
    }) => {
        const now =
            new Date();

        const month =
            now.getMonth() + 1;

        const year =
            now.getFullYear();

        // Base query
        let query =
            supabase
                .from("students")
                .select(`
                    id,
                    full_name,
                    class_name,
                    phone,

                    student_fee_assignments (
                        monthly_fee
                    )
                `);

        // Class filter
        if (
            selectedClass !==
            "ALL"
        ) {
            query = query.eq(
                "class_name",
                selectedClass
            );
        }

        // Fetch students
        const {
            data: students,
            error:
            studentsError,
        } = await query;

        if (studentsError) {
            return {
                data: [],
                error:
                    studentsError,
            };
        }

        // Fetch current month transactions
        const {
            data: transactions,
            error:
            transactionError,
        } = await supabase
            .from(
                "fee_transactions"
            )
            .select(`
                student_id,
                amount
            `)
            .eq(
                "payment_month",
                month
            )
            .eq(
                "payment_year",
                year
            );

        if (
            transactionError
        ) {
            return {
                data: [],
                error:
                    transactionError,
            };
        }

        // Calculate pending
        const defaulters =
            students
                .map(
                    (
                        student: any
                    ) => {
                        const monthlyFee =
                            Number(
                                student
                                    ?.student_fee_assignments?.[0]
                                    ?.monthly_fee || 0
                            );

                        const paid =
                            transactions
                                ?.filter(
                                    (
                                        t: any
                                    ) =>
                                        t.student_id ===
                                        student.id
                                )
                                .reduce(
                                    (
                                        sum: number,
                                        item: any
                                    ) =>
                                        sum +
                                        Number(
                                            item.amount
                                        ),
                                    0
                                ) || 0;

                        const pending =
                            monthlyFee -
                            paid;

                        return {
                            ...student,

                            monthlyFee,

                            paid,

                            pending,
                        };
                    }
                )
                .filter(
                    (
                        student: any
                    ) =>
                        student.pending >
                        0
                );

        return {
            data: defaulters,
            error: null,
        };
    };