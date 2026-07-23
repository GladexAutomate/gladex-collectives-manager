// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MARKETING_URL = "https://gladex-collectives-manager-one.vercel.app/marketing";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${MARKETING_URL}?canva=error&reason=${encodeURIComponent(error)}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${MARKETING_URL}?canva=error&reason=missing_params`, 302);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Look up stored PKCE verifier
  const { data: stateRow, error: stateErr } = await supabase
    .from("canva_oauth_states")
    .select("code_verifier")
    .eq("state", state)
    .single();

  if (stateErr || !stateRow) {
    return Response.redirect(`${MARKETING_URL}?canva=error&reason=invalid_state`, 302);
  }

  // Delete used state immediately
  await supabase.from("canva_oauth_states").delete().eq("state", state);

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${Deno.env.get("SUPABASE_URL") ?? "https://snploarndnyuxapqpegi.supabase.co"}/functions/v1/canva-callback`,
      code_verifier: stateRow.code_verifier,
      client_id: Deno.env.get("CANVA_CLIENT_ID") ?? "OC-AZ-I4G_xGjaE",
      client_secret: Deno.env.get("CANVA_CLIENT_SECRET")!,
    }),
  });

  console.log("Token response status:", tokenRes.status);
  const tokenData = await tokenRes.json();
  console.log("Token data:", JSON.stringify({
    ...tokenData,
    access_token: tokenData.access_token ? tokenData.access_token.slice(0, 20) + "..." : null,
    refresh_token: tokenData.refresh_token ? tokenData.refresh_token.slice(0, 10) + "..." : null,
  }));

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", JSON.stringify(tokenData));
    return Response.redirect(`${MARKETING_URL}?canva=error&reason=token_exchange`, 302);
  }

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // Upsert — single global token row for this integration
  const { error: upsertErr } = await supabase.from("canva_tokens").upsert(
    {
      id: "global",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (upsertErr) {
    console.error("Upsert failed:", JSON.stringify(upsertErr));
    return Response.redirect(`${MARKETING_URL}?canva=error&reason=upsert_failed`, 302);
  }

  console.log("Token saved successfully to canva_tokens. expires_at:", expiresAt);
  return Response.redirect(`${MARKETING_URL}?canva=connected`, 302);
});
