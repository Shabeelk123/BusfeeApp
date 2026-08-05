import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { CreateCoordinatorRequest } from "./types.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const EMAIL_DOMAIN = "school.com";

Deno.serve(async (req) => {
  let createdAuthId: string | null = null;
  let createdUserRow = false;

  try {
    // ── Authorization ──────────────────────────────────────────────────────
    // Service-role key + verify_jwt = false means this function has no
    // built-in caller check. Without this, any request — authenticated or
    // not — could provision a Coordinator Auth account. Mirrors
    // create-grade/index.ts.
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

    const body: CreateCoordinatorRequest = await req.json();

    if (!body.gradeId?.trim()) {
      return Response.json({ error: "gradeId is required" }, { status: 400 });
    }

    if (!body.coordinatorName?.trim()) {
      return Response.json({ error: "Coordinator name is required" }, { status: 400 });
    }

    if (!body.password || body.password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
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

    // Business rule: one coordinator per grade.
    const { data: existingCoordinator, error: existingCoordinatorError } =
      await supabase
        .from("coordinator_accounts")
        .select("id")
        .eq("grade_id", grade.id)
        .maybeSingle();

    if (existingCoordinatorError) throw existingCoordinatorError;

    if (existingCoordinator) {
      return Response.json(
        { error: `Grade ${grade.name} already has a coordinator` },
        { status: 409 }
      );
    }

    const email = `coordinator${grade.name}@${EMAIL_DOMAIN}`;

    // Create Auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
      });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("Failed to create auth user.");
    }

    createdAuthId = authData.user.id;

    // Insert into users table (no `email` column on `users` — email lives on auth.users)
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        role: "COORDINATOR",
        name: body.coordinatorName.trim(),
      });

    if (userError) throw userError;

    createdUserRow = true;

    // Insert coordinator account
    const { error: coordinatorError } = await supabase
      .from("coordinator_accounts")
      .insert({
        user_id: authData.user.id,
        grade_id: grade.id,
      });

    if (coordinatorError) throw coordinatorError;

    return Response.json({
      success: true,
      account: {
        grade: grade.name,
        name: body.coordinatorName.trim(),
        email,
      },
    });
  } catch (error) {
    console.error("Coordinator creation failed:", error);

    if (createdUserRow && createdAuthId) {
      await supabase.from("users").delete().eq("id", createdAuthId);
    }

    if (createdAuthId) {
      await supabase.auth.admin.deleteUser(createdAuthId);
    }

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
