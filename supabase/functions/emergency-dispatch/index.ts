// Edge Function: emergency-dispatch
// Trigger: Postgres webhook on `emergencies` insert.
// Fans out FCM high-priority push to all guardians in the circle.
// After 5s without ACK, also sends SMS fallback.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface EmergencyRow {
  id: string;
  circle_id: string;
  triggered_by: string;
  type: string;
  note: string | null;
  triggered_at: string;
}

const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY")!;
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const { record } = (await req.json()) as { record: EmergencyRow };
  const sb = createClient(SB_URL, SB_SERVICE);

  // 1) Resolve guardians + push tokens
  const { data: guardians } = await sb
    .from("circle_members")
    .select("profile_id, role")
    .eq("circle_id", record.circle_id)
    .in("role", ["guardian", "primary_guardian"]);

  const ids = (guardians ?? []).map((g) => g.profile_id);
  const { data: tokens } = await sb
    .from("push_tokens")
    .select("token")
    .in("profile_id", ids);

  // 2) FCM fan-out
  await Promise.all(
    (tokens ?? []).map((t) =>
      fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: t.token,
          priority: "high",
          data: { emergencyId: record.id, type: record.type },
          notification: {
            title: "긴급 알림",
            body: `${record.type} 상황이 발생했습니다.`,
            sound: "default",
          },
        }),
      })
    )
  );

  // 3) SMS fallback after 5s if still active
  setTimeout(async () => {
    const { data: em } = await sb
      .from("emergencies")
      .select("status")
      .eq("id", record.id)
      .single();
    if (em?.status === "active") {
      // TODO: call NHN Toast / Twilio with guardian phone numbers
    }
  }, 5000);

  return new Response("ok");
});
