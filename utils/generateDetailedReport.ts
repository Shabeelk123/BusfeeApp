export const generateDetailedReport =
    ({
        students,
        feeAssignments,
        transactions,
        selectedMonth,
        selectedYear,
    }: any) => {
        return students.map(
            (student: any) => {
                // FEE
                const feeAssignment =
                    feeAssignments.find(
                        (
                            item: any
                        ) =>
                            item.student_id ===
                            student.id
                    );

                const monthlyFee =
                    Number(
                        feeAssignment?.monthly_fee || 0
                    );

                // MONTH TRANSACTIONS
                const studentTransactions =
                    transactions.filter(
                        (
                            transaction: any
                        ) =>
                            transaction.student_id ===
                            student.id &&
                            transaction.payment_month ===
                            selectedMonth &&
                            transaction.payment_year ===
                            selectedYear
                    );

                // PAID
                const paid =
                    studentTransactions.reduce(
                        (
                            sum: number,
                            item: any
                        ) =>
                            sum +
                            Number(
                                item.amount
                            ),
                        0
                    );

                // PENDING
                const pending =
                    Math.max(
                        monthlyFee -
                        paid,
                        0
                    );

                // ADVANCE
                const advance =
                    paid >
                        monthlyFee
                        ? paid -
                        monthlyFee
                        : 0;

                return {
                    studentId:
                        student.id,

                    studentName:
                        student.full_name,

                    className:
                        student.class_name,

                    monthlyFee,

                    paid,

                    pending,

                    advance,

                    status:
                        pending > 0
                            ? "Pending"
                            : "Paid",
                };
            }
        );
    };