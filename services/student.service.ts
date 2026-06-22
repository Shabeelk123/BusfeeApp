import { supabase } from "../lib/supabase";

interface CreateStudentPayload {
    full_name: string;

    admission_no: string;

    parent_name: string;

    phone: string;

    class_name: string;

    bus_route: string;

    monthly_fee: number;
}

export const getStudents =
    async ({
        page = 0,
        limit = 20,
        search = "",
        selectedClass = "ALL",
    }: {
        page?: number;

        limit?: number;

        search?: string;

        selectedClass?: string;
    }) => {
        const from =
            page * limit;

        const to =
            from + limit - 1;

        let query =
            supabase
                .from("students")
                .select(`
                    id,
                    full_name,
                    admission_no,
                    parent_name,
                    phone,
                    class_name,
                    bus_route,

                    student_fee_assignments (
                        id,
                        monthly_fee,
                        effective_from
                    ),

                    fee_transactions (
                        id,
                        amount,
                        payment_month,
                        payment_year
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                )
                .range(from, to);

        // SEARCH
        if (search.trim()) {
            query = query.or(
                `full_name.ilike.%${search}%,admission_no.ilike.%${search}%,class_name.ilike.%${search}%`
            );
        }

        // CLASS FILTER
        if (
            selectedClass !==
            "ALL"
        ) {
            query = query.eq(
                "class_name",
                selectedClass
            );
        }

        return await query;
    };

export const createStudent =
    async ({
        full_name,
        admission_no,
        parent_name,
        phone,
        class_name,
        bus_route,
        monthly_fee,
        email,
        password,
    }: {
        full_name: string;
        admission_no: string;
        parent_name?: string;
        phone?: string;
        class_name: string;
        bus_route?: string;
        monthly_fee: number;
        email: string;
        password: string;
    }) => {
        // ── PRE-FLIGHT: check uniqueness BEFORE touching Supabase Auth ──────────
        // This prevents orphaned auth users when a DB constraint fails later.

        // 1. Check admission number
        const { data: existingAdmission } = await supabase
            .from("students")
            .select("id")
            .eq("admission_no", admission_no.trim())
            .maybeSingle();

        if (existingAdmission) {
            return {
                error: {
                    message: "admission number already exists",
                } as any,
            };
        }

        // 2. Check email
        const { data: existingEmail } = await supabase
            .from("users")
            .select("id")
            .eq("email", email.trim().toLowerCase())
            .maybeSingle();

        if (existingEmail) {
            return {
                error: {
                    message: "already exists",
                } as any,
            };
        }

        // ── STEP 0: Save the current teacher/admin session. ─────────────────────
        // supabase.auth.signUp() auto-signs-in the new student,
        // which would replace the current session and break all
        // subsequent DB inserts (RLS would apply to the student).
        const { data: { session: currentSession } } =
            await supabase.auth.getSession();

        // ── STEP 1: Create auth user ─────────────────────────────────────────────
        const {
            data: authData,
            error: authError,
        } = await supabase.auth.signUp({ email, password });

        if (authError || !authData.user) {
            return { error: authError };
        }

        const authUser = authData.user;

        // ── STEP 1.5: Restore the teacher/admin session immediately ─────────────
        // so all DB inserts below run with teacher/admin permissions.
        if (currentSession?.access_token && currentSession?.refresh_token) {
            await supabase.auth.setSession({
                access_token: currentSession.access_token,
                refresh_token: currentSession.refresh_token,
            });
        }

        // ── STEP 2: Create student record ────────────────────────────────────────
        const {
            data: studentData,
            error: studentError,
        } = await supabase
            .from("students")
            .insert([{
                auth_id: authUser.id,
                full_name,
                admission_no,
                parent_name,
                phone,
                class_name,
                bus_route,
            }])
            .select()
            .single();

        if (studentError || !studentData) {
            return { error: studentError };
        }

        // ── STEP 3: Create fee assignment ────────────────────────────────────────
        const { error: feeError } = await supabase
            .from("student_fee_assignments")
            .insert([
                {
                    student_id:
                        studentData.id,

                    monthly_fee,

                    effective_from:
                        new Date()
                            .toISOString()
                            .split("T")[0],
                },
            ]);

        if (feeError) {
            return { error: feeError };
        }

        // ── STEP 4: Create users profile (needed for login lookup) ───────────────
        const { error: userError } = await supabase
            .from("users")
            .insert([{
                auth_id: authUser.id,
                name: full_name,
                email,
                role: "STUDENT",
            }]);

        return { error: userError };
    };


export const getStudentById = async (
    id: string
) => {
    return await supabase
        .from("students")
        .select(`
      *,
      student_fee_assignments (
        id,
        monthly_fee,
        effective_from
      ),
      fee_transactions (
        id,
        amount,
        payment_month,
        payment_year,
        note,
        created_at
      )
    `)
        .eq("id", id)
        .single();
};

export const createFeeTransaction =
    async ({
        student_id,
        amount,
        payment_month,
        payment_year,
        note,
    }: {
        student_id: string;

        amount: number;

        payment_month: number;

        payment_year: number;

        note?: string;
    }) => {
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

export const updateStudent =
    async ({
        studentId,
        feeAssignmentId,
        studentData,
        monthlyFee,
    }: {
        studentId: string;

        feeAssignmentId?: string;

        studentData: any;

        monthlyFee: number;
    }) => {
        // STEP 1
        // Update student
        const {
            error: studentError,
        } = await supabase
            .from("students")
            .update(studentData)
            .eq("id", studentId);

        if (studentError) {
            return {
                error: studentError,
            };
        }

        // STEP 2
        // Update existing fee assignment
        if (feeAssignmentId) {
            const {
                error: feeError,
            } = await supabase
                .from(
                    "student_fee_assignments"
                )
                .update({
                    monthly_fee:
                        monthlyFee,
                })
                .eq(
                    "id",
                    feeAssignmentId
                );

            return {
                error: feeError,
            };
        }

        // STEP 3
        // Create fee assignment if missing
        const {
            error: createFeeError,
        } = await supabase
            .from(
                "student_fee_assignments"
            )
            .insert([
                {
                    student_id:
                        studentId,

                    monthly_fee:
                        monthlyFee,

                    effective_from:
                        new Date()
                            .toISOString()
                            .split(
                                "T"
                            )[0],
                },
            ]);

        return {
            error:
                createFeeError,
        };
    };

export const deleteStudent =
    async (id: string) => {
        return await supabase
            .from("students")
            .delete()
            .eq("id", id);
    };

export const getTeacherStudents =
    async (
        assignedClass: string
    ) => {
        return await supabase
            .from("students")
            .select(`
        *,
        student_fee_assignments (
          monthly_fee
        ),
        fee_transactions (
          amount,
          payment_month,
          payment_year
        )
      `)
            .eq(
                "class_name",
                assignedClass
            )
            .order("created_at", {
                ascending: false,
            });
    };

export const getCurrentStudent =
    async () => {
        const {
            data: sessionData,
        } =
            await supabase.auth.getSession();

        const authUser =
            sessionData?.session?.user;

        if (!authUser) {
            return {
                data: null,
            };
        }

        return await supabase
            .from("students")
            .select(`
        *,
        student_fee_assignments (
          monthly_fee
        ),
        fee_transactions (
          *
        )
      `)
            .eq(
                "auth_id",
                authUser.id
            )
            .single();
    };