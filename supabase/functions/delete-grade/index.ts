import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface DeleteGradeRequest {
  gradeId: string;
}

Deno.serve(async (req) => {
  try {
    // ── Authorization ──────────────────────────────────────────────────────
    // Service-role key + verify_jwt = false means this function has no
    // built-in caller check. Without this, any request — authenticated or
    // not — could delete a grade, its divisions, and every class/coordinator
    // Auth account tied to it.
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

    const body: DeleteGradeRequest = await req.json();

    if (!body.gradeId?.trim()) {
      return Response.json({ error: "gradeId is required" }, { status: 400 });
    }

    const { data: grade, error: gradeFetchError } = await supabase
      .from("grades")
      .select("id, name")
      .eq("id", body.gradeId)
      .maybeSingle();

    if (gradeFetchError) throw gradeFetchError;

    if (!grade) {
      return Response.json({ error: "Grade not found" }, { status: 404 });
    }

    // Block deletion while students are still enrolled in this grade —
    // students/fees do not cascade-delete from grades/divisions.
    const { count: studentCount, error: studentCountError } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("grade_id", grade.id);

    if (studentCountError) throw studentCountError;

    if (studentCount && studentCount > 0) {
      return Response.json(
        {
          error: `Cannot delete grade ${grade.name}: ${studentCount} student(s) are still enrolled in it. Remove or reassign them first.`,
        },
        { status: 409 }
      );
    }

    // Collect class account user ids (for auth cleanup)
    const { data: classAccounts, error: classAccountsError } = await supabase
      .from("class_accounts")
      .select("id, user_id")
      .eq("grade_id", grade.id);

    if (classAccountsError) throw classAccountsError;

    // Collect coordinator account user ids (for auth cleanup)
    const { data: coordinatorAccounts, error: coordinatorAccountsError } =
      await supabase
        .from("coordinator_accounts")
        .select("id, user_id")
        .eq("grade_id", grade.id);

    if (coordinatorAccountsError) throw coordinatorAccountsError;

    const authIdsToDelete = [
      ...(classAccounts ?? []).map((a) => a.user_id),
      ...(coordinatorAccounts ?? []).map((a) => a.user_id),
    ];

    // 1. Delete class_accounts for this grade
    if (classAccounts && classAccounts.length > 0) {
      const { error } = await supabase
        .from("class_accounts")
        .delete()
        .in("id", classAccounts.map((a) => a.id));
      if (error) throw error;
    }

    // 2. Delete coordinator_accounts for this grade
    if (coordinatorAccounts && coordinatorAccounts.length > 0) {
      const { error } = await supabase
        .from("coordinator_accounts")
        .delete()
        .in("id", coordinatorAccounts.map((a) => a.id));
      if (error) throw error;
    }

    // 3. Delete users rows (class + coordinator accounts share the users table)
    if (authIdsToDelete.length > 0) {
      const { error } = await supabase
        .from("users")
        .delete()
        .in("id", authIdsToDelete);
      if (error) throw error;
    }

    // 4. Delete the Supabase Auth users
    for (const authId of authIdsToDelete) {
      await supabase.auth.admin.deleteUser(authId);
    }

    // 5. Delete divisions for this grade
    const { error: divisionsError } = await supabase
      .from("divisions")
      .delete()
      .eq("grade_id", grade.id);
    if (divisionsError) throw divisionsError;

    // 6. Delete the grade itself
    const { error: deleteGradeError } = await supabase
      .from("grades")
      .delete()
      .eq("id", grade.id);
    if (deleteGradeError) throw deleteGradeError;

    return Response.json({
      success: true,
      message: `Grade ${grade.name} and its class/coordinator accounts were deleted.`,
    });
  } catch (error) {
    console.error("Grade deletion failed:", error);

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
