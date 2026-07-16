export const calculateFeeBalance = ({
    monthlyFee,
    transactions,
    joinDate,
    effectiveFrom,
}: {
    monthlyFee: number;

    transactions: any[];

    /** Created-at timestamp of the student row — used as fallback only */
    joinDate: string;

    /** The fee assignment's effective_from date — preferred start of dues */
    effectiveFrom?: string;
}) => {
    // Use effectiveFrom if available; otherwise fall back to joinDate.
    // We normalise to the 1st of the effective month so partial months
    // are not double-counted.
    const rawStart = effectiveFrom || joinDate;
    const startDate = new Date(rawStart);
    const joined = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        1
    );

    const now = new Date();
    const nowNorm = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total months from effective start (inclusive of current month)
    const totalMonths =
        (nowNorm.getFullYear() - joined.getFullYear()) * 12 +
        (nowNorm.getMonth() - joined.getMonth()) +
        1;

    // Expected fee
    const expectedAmount = Math.max(0, totalMonths) * monthlyFee;

    // Total paid
    const totalPaid = transactions.reduce(
        (sum, item) => sum + Number(item.amount),
        0
    );

    // Balance
    const balance = expectedAmount - totalPaid;

    return {
        totalMonths: Math.max(0, totalMonths),

        expectedAmount,

        totalPaid,

        balance,

        isAdvance: balance < 0,

        advanceAmount: balance < 0 ? Math.abs(balance) : 0,

        dueAmount: balance > 0 ? balance : 0,
    };
};