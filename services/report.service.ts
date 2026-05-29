import { supabase } from "../lib/supabase";

export const getReportData =
    async ({
        selectedClass = "ALL",
    }: {
        selectedClass?: string;
    }) => {
        // Students
        let studentsQuery =
            supabase
                .from("students")
                .select("*");

        if (
            selectedClass !==
            "ALL"
        ) {
            studentsQuery =
                studentsQuery.eq(
                    "class_name",
                    selectedClass
                );
        }

        const {
            data: students,
            error:
            studentsError,
        } =
            await studentsQuery;

        if (studentsError) {
            return {
                data: null,
                error:
                    studentsError,
            };
        }

        // Fee assignments
        const {
            data:
            feeAssignments,
        } = await supabase
            .from(
                "student_fee_assignments"
            )
            .select("*");

        // Transactions
        const {
            data: transactions,
        } = await supabase
            .from(
                "fee_transactions"
            )
            .select("*");

        return {
            data: {
                students,
                feeAssignments,
                transactions,
            },

            error: null,
        };
    };