import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the calling user is authenticated faculty
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !callingUser) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if calling user is faculty
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "faculty")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only faculty can add students" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, rollNo } = await req.json();

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid student name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!rollNo || typeof rollNo !== "string" || rollNo.trim().length === 0 || rollNo.length > 10) {
      return new Response(JSON.stringify({ error: "Invalid roll number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^[0-9]+$/.test(rollNo.trim())) {
      return new Response(JSON.stringify({ error: "Roll number must contain only digits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if roll number already exists
    const { data: existingStudent } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("roll_no", rollNo.trim())
      .maybeSingle();

    if (existingStudent) {
      return new Response(JSON.stringify({ error: "Roll number already exists" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user for student with synthetic email
    const email = `${rollNo.trim()}@student.digitalscan.local`;
    const defaultPassword = `Student@${rollNo.trim()}`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Failed to create student account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authId = authData.user.id;

    // Create student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .insert({ name: name.trim(), roll_no: rollNo.trim(), auth_id: authId })
      .select("id, name, roll_no, auth_id, created_at")
      .single();

    if (studentError) {
      await supabaseAdmin.auth.admin.deleteUser(authId);
      return new Response(JSON.stringify({ error: "Failed to create student record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign student role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authId, role: "student" });

    if (roleError) {
      await supabaseAdmin.from("students").delete().eq("id", student.id);
      await supabaseAdmin.auth.admin.deleteUser(authId);
      return new Response(JSON.stringify({ error: "Failed to assign role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, student }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
