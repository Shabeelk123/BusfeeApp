// V2 Student — matches V2 students table exactly
export interface Student {
    id: string;
    admission_no: string;
    name: string;
    grade_id: string;
    division_id: string;
    monthly_fee: number;
    user_id?: string | null;
    created_at: string;
}