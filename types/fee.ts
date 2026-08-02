// V2 fee types

export type FeeStatus = "Pending" | "Partial" | "Paid" | "Excluded";

export interface StudentMonthlyFee {
    id: string;
    student_id: string;
    month: number;       // 1–12
    year: number;
    fee: number;
    paid_amount: number;
    status: FeeStatus;
    excluded: boolean;
    reason?: string | null;
    created_at: string;
    updated_at: string;
}

export interface FeeTransaction {
    id: string;
    student_month_fee_id: string;
    amount: number;
    payment_date: string;
    collected_by?: string | null;
    remarks?: string | null;
    created_at: string;
}