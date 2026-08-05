import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AccountType, ResetAccountPasswordRequest } from "./types.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ACCOUNT_TABLES: Record<AccountType, string> = {
  CLASS: "class_accounts",
  COORDINATOR: "coordinator_accounts",
};

Deno.serve(async (req) => {
  try {
    // ── Authorization ──────────────────────────────────────────────────────
    // Service-role key + verify_jwt = false means this function has no
    // built-in caller check. Without this, any request — authenticated or
    // not — could overwrite any account's password. Mirrors
    // delete-student/index.ts.
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

    const body: ResetAccountPasswordRequest = await req.json();

    const table = ACCOUNT_TABLES[body.accountType];
    if (!table) {
      return Response.json({ error: "Invalid accountType" }, { status: 400 });
    }

    if (!body.accountId?.trim()) {
      return Response.json({ error: "accountId is required" }, { status: 400 });
    }

    if (!body.newPassword || body.newPassword.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const { data: account, error: accountFetchError } = await supabase
      .from(table)
      .select("id, user_id")
      .eq("id", body.accountId)
      .maybeSingle();

    if (accountFetchError) throw accountFetchError;

    if (!account) {
      const label = body.accountType === "COORDINATOR" ? "Coordinator" : "Class";
      return Response.json({ error: `${label} account not found` }, { status: 404 });
    }

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
      account.user_id,
      { password: body.newPassword }
    );

    if (updateAuthError) throw updateAuthError;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Account password reset failed:", error);

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
