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
    const { name, username, password } = await req.json();

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!username || typeof username !== "string" || username.trim().length < 3 || username.length > 30) {
      return new Response(JSON.stringify({ error: "Username must be 3-30 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return new Response(JSON.stringify({ error: "Username can only contain letters, numbers, dots, hyphens, underscores" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!password || typeof password !== "string" || password.length < 6 || password.length > 100) {
      return new Response(JSON.stringify({ error: "Password must be 6-100 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if any faculty already exists (bootstrap check)
    const { count: facultyCount } = await supabaseAdmin
      .from("faculty")
      .select("id", { count: "exact", head: true });

    // If faculty already exist, require authentication from an existing faculty member
    if (facultyCount && facultyCount > 0) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Registration requires approval from an existing faculty member. Please ask a colleague to add you." }), {
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

      // Verify calling user is faculty
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", callingUser.id)
        .eq("role", "faculty")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Only existing faculty members can register new faculty" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check if username already exists
    const { data: existing } = await supabaseAdmin
      .from("faculty")
      .select("id")
      .eq("username", username.trim())
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Username already exists" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user with synthetic email
    const email = `${username.trim().toLowerCase()}@faculty.digitalscan.local`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Failed to create account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authId = authData.user.id;

    // Create faculty record
    const { data: faculty, error: facultyError } = await supabaseAdmin
      .from("faculty")
      .insert({ name: name.trim(), username: username.trim(), auth_id: authId })
      .select("id, name, username, auth_id, created_at")
      .single();

    if (facultyError) {
      // Cleanup auth user on failure
      await supabaseAdmin.auth.admin.deleteUser(authId);
      return new Response(JSON.stringify({ error: "Failed to create faculty record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign faculty role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authId, role: "faculty" });

    if (roleError) {
      // Cleanup on failure
      await supabaseAdmin.from("faculty").delete().eq("id", faculty.id);
      await supabaseAdmin.auth.admin.deleteUser(authId);
      return new Response(JSON.stringify({ error: "Failed to assign role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, faculty }), {
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
