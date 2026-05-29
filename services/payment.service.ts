import { supabase } from "../lib/supabase";

interface AddPaymentPayload {
    student_id: string;

    amount: number;

    payment_month: number;

    payment_year: number;

    note?: string;
}

export const addPayment =
    async ({
        student_id,
        amount,
        payment_month,
        payment_year,
        note,
    }: AddPaymentPayload) => {
        return await supabase
            .from("fee_transactions")
            .insert([
                {
                    student_id,

                    amount,

                    payment_month,

                    payment_year,

                    note,
                },
            ]);
    };