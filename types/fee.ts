export interface StudentFeeAssignment {
    id: string;

    student_id: string;

    monthly_fee: number;

    effective_from: string;
}

export interface FeeTransaction {
    id: string;

    student_id: string;

    amount: number;

    payment_month: number;

    payment_year: number;

    note?: string;

    created_at: string;
}