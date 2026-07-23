// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get stored access token
  const { data: tokenRow, error: tokenErr } = await supabase
    .from("canva_tokens")
    .select("access_token, expires_at")
    .eq("id", "global")
    .single();

  if (tokenErr || !tokenRow) {
    return json({ error: "Not connected to Canva. Please connect first." }, 401);
  }

  const { action, templateId, fields } = await req.json();

  // Debug: probe multiple endpoint variants to find what works
  if (action === "test_token") {
    const authHeader = `Bearer ${tokenRow.access_token}`;

    const [profileRes, bt_noVer, bt_v2024, bt_v2023, designsRes] = await Promise.all([
      fetch("https://api.canva.com/rest/v1/users/me", {
        headers: { Authorization: authHeader, "Api-Version": "2024-06-18" },
      }),
      // brandtemplates — no Api-Version header
      fetch("https://api.canva.com/rest/v1/brandtemplates?limit=5", {
        headers: { Authorization: authHeader },
      }),
      // brandtemplates — version 2024-06-18
      fetch("https://api.canva.com/rest/v1/brandtemplates?limit=5", {
        headers: { Authorization: authHeader, "Api-Version": "2024-06-18" },
      }),
      // brandtemplates — older version 2023-12-20
      fetch("https://api.canva.com/rest/v1/brandtemplates?limit=5", {
        headers: { Authorization: authHeader, "Api-Version": "2023-12-20" },
      }),
      // designs endpoint — might include brand templates
      fetch("https://api.canva.com/rest/v1/designs?limit=5", {
        headers: { Authorization: authHeader, "Api-Version": "2024-06-18" },
      }),
    ]);

    const [profileData, bt_noVerData, bt_v2024Data, bt_v2023Data, designsData] =
      await Promise.all([
        profileRes.json(),
        bt_noVer.json(),
        bt_v2024.json(),
        bt_v2023.json(),
        designsRes.json(),
      ]);

    return json({
      profile_status: profileRes.status,
      profile_team_id: profileData?.team_user?.team_id,
      bt_noVersion: { status: bt_noVer.status, data: bt_noVerData },
      bt_version_2024: { status: bt_v2024.status, data: bt_v2024Data },
      bt_version_2023: { status: bt_v2023.status, data: bt_v2023Data },
      designs_endpoint: { status: designsRes.status, data: designsData },
      token_expires_at: tokenRow.expires_at,
    });
  }

  // List brand templates from the connected Canva account
  if (action === "list_templates") {
    const res = await fetch("https://api.canva.com/rest/v1/brandtemplates?limit=50", {
      headers: {
        Authorization: `Bearer ${tokenRow.access_token}`,
        "Api-Version": "2024-06-18",
      },
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data, httpStatus: res.status });
    return json({ templates: data.items ?? [] });
  }

  // Start an autofill job for a specific brand template
  if (action === "autofill") {
    if (!templateId || !fields) return json({ error: "templateId and fields required" }, 400);

    const res = await fetch("https://api.canva.com/rest/v1/autofills", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenRow.access_token}`,
        "Content-Type": "application/json",
        "Api-Version": "2024-06-18",
      },
      body: JSON.stringify({
        brand_template_id: templateId,
        title: `Gladex Poster – ${fields.packageName ?? ""}`,
        data: buildAutofillData(fields),
      }),
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data });
    return json({ jobId: data.job?.id });
  }

  // Poll autofill job status
  if (action === "check_job") {
    if (!templateId) return json({ error: "jobId required as templateId" }, 400);

    const res = await fetch(`https://api.canva.com/rest/v1/autofills/${templateId}`, {
      headers: { Authorization: `Bearer ${tokenRow.access_token}`, "Api-Version": "2024-06-18" },
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data });
    return json(data);
  }

  return json({ error: "Unknown action. Use list_templates | autofill | check_job" }, 400);
});

function buildAutofillData(fields: Record<string, string>) {
  const mapping: Record<string, string> = {
    packageName: fields.packageName ?? "",
    destination: fields.destination ?? "",
    dates: fields.dateFrom && fields.dateTo
      ? `${fields.dateFrom} – ${fields.dateTo}`
      : (fields.dateFrom ?? fields.dateTo ?? ""),
    price: fields.price ?? "",
    inclusions: fields.inclusions ?? "",
    tagline: fields.tagline ?? "",
    duration: fields.duration ?? "",
    tourCode: fields.tourCode ?? "",
    downpayment: fields.downpayment ?? "",
  };

  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([, v]) => v !== "")
      .map(([k, v]) => [k, { type: "text", text: v }])
  );
}
