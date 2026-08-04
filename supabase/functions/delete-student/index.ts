import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface DeleteStudentRequest {
  studentId: string;
}

Deno.serve(async (req) => {
  try {
    // ── Authorization ──────────────────────────────────────────────────────
    // Service-role key + verify_jwt = true at the gateway is not enough on
    // its own — any authenticated user's JWT would still pass the gateway
    // check, so we must also confirm the caller is an ADMIN before deleting
    // anyone's account. Mirrors delete-grade/index.ts.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return Response.json({ error: "Missing authorization" }, { status: 401 });
    }

    const { data: { user: callerUser }, error: callerAuthError } =
      await supabase.auth.getUser(token);

    if (callerAuthError || !callerUser) {
      return Response.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", callerUser.id)
      .single();

    if (callerProfile?.role !== "ADMIN") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body: DeleteStudentRequest = await req.json();

    if (!body.studentId?.trim()) {
      return Response.json({ error: "studentId is required" }, { status: 400 });
    }

    const { data: student, error: studentFetchError } = await supabase
      .from("students")
      .select("id, user_id")
      .eq("id", body.studentId)
      .maybeSingle();

    if (studentFetchError) throw studentFetchError;

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete the student row first — student_monthly_fees and, in turn,
    // fee_transactions both cascade from students(id) on delete. `users.id`
    // has no cascade from students, so it must go before the Auth account
    // is removed or the users-row cascade below would hit a dangling
    // students.user_id reference and fail.
    const { error: deleteStudentError } = await supabase
      .from("students")
      .delete()
      .eq("id", student.id);

    if (deleteStudentError) throw deleteStudentError;

    // Delete the linked Supabase Auth account, if the student had a login.
    // `users.id` references auth.users(id) on delete cascade, so this also
    // removes the `users` row — no separate delete needed for it.
    if (student.user_id) {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
        student.user_id
      );

      if (deleteAuthError) throw deleteAuthError;
    }

    return Response.json({
      success: true,
      message: "Student deleted.",
    });
  } catch (error) {
    console.error("Student deletion failed:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
});
