export interface MonthEntry {
    month: number;   // 1-based
    year: number;
    expected: number;
    paid: number;
    status: "PAID" | "PARTIAL" | "PENDING";
}

/**
 * Build a chronological ledger of monthly fee entries from the student's
 * effective start date up to `untilDate` (defaults to current month).
 * Payments are distributed oldest-first (waterfall / FIFO).
 */
export const buildMonthLedger = ({
    monthlyFee,
    effectiveFrom,
    joinDate,
    transactions,
    untilDate,
}: {
    monthlyFee: number;
    effectiveFrom?: string;
    joinDate: string;
    transactions: { amount: number; payment_month: number; payment_year: number }[];
    /** Inclusive upper bound — defaults to current month */
    untilDate?: Date;
}): MonthEntry[] => {
    const rawStart = effectiveFrom || joinDate;
    const startDate = new Date(rawStart);
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = untilDate
        ? new Date(untilDate.getFullYear(), untilDate.getMonth(), 1)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const entries: MonthEntry[] = [];
    let cur = new Date(start);
    while (cur <= end) {
        entries.push({
            month: cur.getMonth() + 1,
            year: cur.getFullYear(),
            expected: monthlyFee,
            paid: 0,
            status: "PENDING",
        });
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    // Distribute total payment pool oldest-first
    let pool = transactions.reduce((s, t) => s + Number(t.amount), 0);

    for (const entry of entries) {
        if (pool <= 0) {
            entry.status = "PENDING";
            continue;
        }
        if (pool >= entry.expected) {
            entry.paid = entry.expected;
            pool -= entry.expected;
            entry.status = "PAID";
        } else {
            entry.paid = pool;
            pool = 0;
            entry.status = "PARTIAL";
        }
    }

    return entries;
};

/** Remaining payment pool after all dues are settled = advance credit */
export const calcAdvanceFromLedger = (entries: MonthEntry[], totalPaid: number): number => {
    const totalExpected = entries.reduce((s, e) => s + e.expected, 0);
    const remaining = totalPaid - totalExpected;
    return remaining > 0 ? remaining : 0;
};

// ─────────────────────────────────────────────────────────────────────────────

export const generateMonthlyFeeStatus = ({
    monthlyFee,
    joinDate,
    effectiveFrom,
    transactions,
}: {
    monthlyFee: number;
    joinDate: string;
    effectiveFrom?: string;
    transactions: any[];
}) => {
    const months = buildMonthLedger({
        monthlyFee,
        effectiveFrom,
        joinDate,
        transactions,
    });

    const totalPaid = transactions.reduce((s, t) => s + Number(t.amount), 0);
    const advanceAmount = calcAdvanceFromLedger(months, totalPaid);

    return {
        months,
        advanceAmount,
    };
};