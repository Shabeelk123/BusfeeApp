export const calculateFeeBalance = ({
    monthlyFee,
    transactions,
    joinDate,
}: {
    monthlyFee: number;

    transactions: any[];

    joinDate: string;
}) => {
    const joined =
        new Date(joinDate);

    const now = new Date();

    // Total months from joining
    const totalMonths =
        (now.getFullYear() -
            joined.getFullYear()) *
        12 +
        (now.getMonth() -
            joined.getMonth()) +
        1;

    // Expected fee
    const expectedAmount =
        totalMonths * monthlyFee;

    // Total paid
    const totalPaid =
        transactions.reduce(
            (sum, item) =>
                sum + item.amount,
            0
        );

    // Balance
    const balance =
        expectedAmount - totalPaid;

    return {
        totalMonths,

        expectedAmount,

        totalPaid,

        balance,

        isAdvance: balance < 0,

        advanceAmount:
            balance < 0
                ? Math.abs(balance)
                : 0,

        dueAmount:
            balance > 0
                ? balance
                : 0,
    };
};