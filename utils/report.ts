import { ReportStudentRow } from "../services/report.service";

/**
 * Summarize a set of report rows (see report.service.ts::getReportData) —
 * one row per student for the selected month/year.
 */
export const generateReportSummary = ({ rows }: { rows: ReportStudentRow[] }) => {
    let totalCollection = 0;
    let totalPending = 0;
    let totalAdvance = 0;
    let defaultersCount = 0;

    rows.forEach((row) => {
        const paid = row.paid_amount ?? 0;
        const fee = row.fee ?? 0;
        const pending = row.status === "Excluded" ? 0 : Math.max(fee - paid, 0);
        const advance = paid > fee ? paid - fee : 0;

        totalCollection += paid;
        totalPending += pending;
        totalAdvance += advance;

        if (pending > 0) defaultersCount++;
    });

    const expected = totalCollection + totalPending;
    const collectionRate = expected > 0 ? Math.round((totalCollection / expected) * 100) : 0;

    return {
        totalStudents: rows.length,
        totalCollection,
        totalPending,
        totalAdvance,
        defaultersCount,
        collectionRate,
    };
};
