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

    // Verify the calling user is an authenticated student
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

    // Check if calling user is a student
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "student")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only students can mark attendance" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the student record linked to this auth user
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, name, roll_no")
      .eq("auth_id", callingUser.id)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: "Student record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { qrCode, deviceFingerprint } = await req.json();

    // Validate QR code format
    if (!qrCode || typeof qrCode !== "string" || qrCode.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid QR code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^DIGITALSCAN-\d+-[a-z0-9]+$/.test(qrCode)) {
      return new Response(JSON.stringify({ error: "Invalid QR code format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate device fingerprint
    if (!deviceFingerprint || typeof deviceFingerprint !== "string" || deviceFingerprint.length > 500) {
      return new Response(JSON.stringify({ error: "Device verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up lecture by QR code
    const { data: lecture, error: lectureError } = await supabaseAdmin
      .from("lectures")
      .select("*")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (lectureError || !lecture) {
      return new Response(JSON.stringify({ error: "Invalid QR code or lecture not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if lecture is active
    if (!lecture.is_active) {
      return new Response(JSON.stringify({ error: "This lecture session has ended" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if lecture hasn't expired
    const now = new Date();
    const endTime = new Date(lecture.end_time);
    if (now > endTime) {
      return new Response(JSON.stringify({ error: "QR code has expired. The lecture session has ended." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already marked by this student
    const { data: existingRecord } = await supabaseAdmin
      .from("attendance_records")
      .select("id")
      .eq("student_id", student.id)
      .eq("lecture_id", lecture.id)
      .maybeSingle();

    if (existingRecord) {
      return new Response(JSON.stringify({ error: "Attendance already marked for this lecture", alreadyMarked: true }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this device already marked attendance for this lecture
    const { data: deviceRecord } = await supabaseAdmin
      .from("attendance_records")
      .select("id")
      .eq("lecture_id", lecture.id)
      .eq("device_fingerprint", deviceFingerprint)
      .maybeSingle();

    if (deviceRecord) {
      return new Response(JSON.stringify({ 
        error: "Attendance has already been marked from this device for this lecture.",
        deviceDuplicate: true
      }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark attendance
    const lectureDate = now.toISOString().split("T")[0];
    const punchTime = now.toLocaleTimeString();

    const { data: record, error: insertError } = await supabaseAdmin
      .from("attendance_records")
      .insert({
        student_id: student.id,
        student_name: student.name,
        student_roll_no: student.roll_no,
        lecture_id: lecture.id,
        lecture_title: lecture.title,
        lecture_date: lectureDate,
        lecture_room: lecture.room,
        punch_time: punchTime,
        status: "present",
        device_fingerprint: deviceFingerprint,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to mark attendance" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, record }), {
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
