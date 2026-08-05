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

export interface TopPendingClass {
    label: string;
    pending: number;
    studentsCount: number;
}

/**
 * Group report rows by class (grade-division) and rank by highest pending
 * amount. Shared by the Admin and Coordinator dashboards' "Top Pending
 * Classes" section — Coordinator's `rows` are simply pre-scoped to one grade.
 */
export const getTopPendingClasses = (rows: ReportStudentRow[], limit = 5): TopPendingClass[] => {
    const byClass = new Map<string, TopPendingClass>();

    for (const row of rows) {
        if (row.status === "Excluded") continue;
        const pending = Math.max(0, (row.fee ?? 0) - (row.paid_amount ?? 0));
        if (pending <= 0) continue;

        const label = `${row.grade?.name ?? "-"}-${row.division?.name ?? "-"}`;
        const entry = byClass.get(label) ?? { label, pending: 0, studentsCount: 0 };
        entry.pending += pending;
        entry.studentsCount += 1;
        byClass.set(label, entry);
    }

    return [...byClass.values()].sort((a, b) => b.pending - a.pending).slice(0, limit);
};
