export const generateMonthlyFeeStatus = ({
    monthlyFee,
    joinDate,
    transactions,
}: {
    monthlyFee: number;

    joinDate: string;

    transactions: any[];
}) => {
    const joined =
        new Date(joinDate);

    const now = new Date();

    const months = [];

    // Generate all months
    let current = new Date(
        joined.getFullYear(),
        joined.getMonth(),
        1
    );

    while (current <= now) {
        months.push({
            month:
                current.getMonth() + 1,

            year:
                current.getFullYear(),

            expected: monthlyFee,

            paid: 0,

            status: "PENDING",
        });

        current = new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            1
        );
    }

    // Total payment pool
    let paymentPool =
        transactions.reduce(
            (sum, item) =>
                sum + item.amount,
            0
        );

    // Distribute payments oldest first
    for (let item of months) {
        if (paymentPool <= 0) {
            item.status = "PENDING";
            continue;
        }

        if (
            paymentPool >= item.expected
        ) {
            item.paid = item.expected;

            paymentPool -= item.expected;

            item.status = "PAID";
        } else {
            item.paid = paymentPool;

            paymentPool = 0;

            item.status = "PARTIAL";
        }
    }

    // Remaining advance
    const advanceAmount =
        paymentPool > 0
            ? paymentPool
            : 0;

    return {
        months,

        advanceAmount,
    };
};