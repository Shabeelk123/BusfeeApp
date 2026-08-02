import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const EMAIL_DOMAIN = "school.com";
const DEFAULT_PASSWORD_SUFFIX = "@123";

interface CreateGradeRequest {
  gradeName: string;
  divisions: string[];
}

    // Store created ids for rollback later
    const createdDivisionIds: string[] = [];
    const createdAuthIds: string[] = [];
    const createdUserIds: string[] = [];
    const createdClassAccountIds: string[] = [];
    let createdGradeId: string | null = null;

Deno.serve(async (req) => {
  try {
    const body: CreateGradeRequest = await req.json();

    if (!body.gradeName?.trim()) {
      return Response.json(
        { error: "Grade name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.divisions) || body.divisions.length === 0) {
      return Response.json(
        { error: "Select at least one division" },
        { status: 400 }
      );
    }

    // Check duplicate grade
    const { data: existingGrade } = await supabase
      .from("grades")
      .select("id")
      .eq("name", body.gradeName)
      .maybeSingle();

    if (existingGrade) {
      return Response.json(
        {
          error: `Grade ${body.gradeName} already exists`,
        },
        {
          status: 409,
        }
      );
    }

    // Create Grade
    const { data: grade, error: gradeError } = await supabase
      .from("grades")
      .insert({
        name: body.gradeName,
      })
      .select()
      .single();

    if (grade) {
        createdGradeId = grade.id;
    }

    if (gradeError) throw gradeError;

    const createdAccounts = [];

    // Loop through divisions
    for (const rawDivision of body.divisions) {
      const divisionName = rawDivision.trim().toUpperCase();
      const className = `${body.gradeName}${divisionName}`;
      const email = `${className}@${EMAIL_DOMAIN}`;
      const password = `${className}${DEFAULT_PASSWORD_SUFFIX}`;

      // Check duplicate division
      const { data: existingDivision } = await supabase
        .from("divisions")
        .select("id")
        .eq("grade_id", grade.id)
        .eq("name", divisionName)
        .maybeSingle();

      if (existingDivision) {
        throw new Error(
          `Division ${divisionName} already exists`
        );
      }

      // Create division
      const { data: division, error: divisionError } = await supabase
        .from("divisions")
        .insert({
          grade_id: grade.id,
          name: divisionName,
        })
        .select()
        .single();

      if (divisionError) throw divisionError;

      createdDivisionIds.push(division.id);

            // Create Auth User
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create auth user.");
      }

      createdAuthIds.push(authData.user.id);

      // Insert into users table
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          role: "CLASS",
          name: className,
          email,
        });

      if (userError) {
        throw userError;
      }

      createdUserIds.push(authData.user.id);

      // Insert class account
      const { data: classAccount, error: classAccountError } =
        await supabase
          .from("class_accounts")
          .insert({
            user_id: authData.user.id,
            grade_id: grade.id,
            division_id: division.id,
          })
          .select()
          .single();

      if (classAccountError) {
        throw classAccountError;
      }

      createdClassAccountIds.push(classAccount.id);

      // Store credentials for response
      createdAccounts.push({
        class: className,
        email,
        password,
      });
    }

    return Response.json({
      success: true,
      message: "Grade created successfully.",
      accounts: createdAccounts,
    });

  } catch (error) {
  console.error("Provisioning failed:", error);

  // 1. Delete class_accounts
  if (createdClassAccountIds.length > 0) {
    await supabase
      .from("class_accounts")
      .delete()
      .in("id", createdClassAccountIds);
  }

  // 2. Delete users
  if (createdUserIds.length > 0) {
    await supabase
      .from("users")
      .delete()
      .in("id", createdUserIds);
  }

  // 3. Delete Auth users
  for (const authId of createdAuthIds) {
    await supabase.auth.admin.deleteUser(authId);
  }

  // 4. Delete divisions
  if (createdDivisionIds.length > 0) {
    await supabase
      .from("divisions")
      .delete()
      .in("id", createdDivisionIds);
  }

  // 5. Delete grade
  if (createdGradeId) {
    await supabase
      .from("grades")
      .delete()
      .eq("id", createdGradeId);
  }

  return Response.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Internal Server Error",
    },
    {
      status: 500,
    }
  );
}
});