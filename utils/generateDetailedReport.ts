import { ReportStudentRow } from "../services/report.service";

export interface DetailedReportRow {
    studentId: string;
    studentName: string;
    className: string;
    monthlyFee: number;
    paid: number;
    pending: number;
    advance: number;
    status: "Paid" | "Pending";
}

/**
 * Build the per-student table shown on the Reports screen and exported to
 * the PDF, from report.service.ts::getReportData rows.
 */
export const generateDetailedReport = ({ rows }: { rows: ReportStudentRow[] }): DetailedReportRow[] => {
    return rows.map((row) => {
        const paid = row.paid_amount ?? 0;
        const fee = row.fee ?? 0;
        const pending = row.status === "Excluded" ? 0 : Math.max(fee - paid, 0);
        const advance = paid > fee ? paid - fee : 0;

        return {
            studentId: row.id,
            studentName: row.name,
            className: `${row.grade?.name ?? "-"}-${row.division?.name ?? "-"}`,
            monthlyFee: fee,
            paid,
            pending,
            advance,
            status: pending > 0 ? "Pending" : "Paid",
        };
    });
};
