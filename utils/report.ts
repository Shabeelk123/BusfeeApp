export const generateReportSummary =
    ({
        students,
        feeAssignments,
        transactions,
        selectedMonth,
        selectedYear,
    }: any) => {
        let totalCollection = 0;

        let totalPending = 0;

        let totalAdvance = 0;

        let defaultersCount = 0;

        students.forEach(
            (student: any) => {
                // FIND FEE
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

                // FILTER MONTH TRANSACTIONS
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

                // TOTAL PAID
                const totalPaid =
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
                        totalPaid,
                        0
                    );

                // ADVANCE
                const advance =
                    totalPaid >
                        monthlyFee
                        ? totalPaid -
                        monthlyFee
                        : 0;

                totalCollection +=
                    totalPaid;

                totalPending +=
                    pending;

                totalAdvance +=
                    advance;

                if (
                    pending > 0
                ) {
                    defaultersCount++;
                }
            }
        );

        const expected =
            totalCollection +
            totalPending;

        const collectionRate =
            expected > 0
                ? Math.round(
                    (totalCollection /
                        expected) *
                    100
                )
                : 0;

        return {
            totalStudents:
                students.length,

            totalCollection,

            totalPending,

            totalAdvance,

            defaultersCount,

            collectionRate,
        };
    };