// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandom(16);

  await supabase.from("canva_oauth_states").insert({ state, code_verifier: codeVerifier });

  const scopes = [
    "design:content:read",
    "design:content:write",
    "asset:read",
    "asset:write",
    "brandtemplate:content:read",
    "brandtemplate:meta:read",
    "profile:read",
  ].join(" ");

  const clientId = Deno.env.get("CANVA_CLIENT_ID") ?? "OC-AZ-I4G_xGjaE";
  const redirectUri = `${Deno.env.get("SUPABASE_URL") ?? "https://snploarndnyuxapqpegi.supabase.co"}/functions/v1/canva-callback`;

  // Build URL manually — URLSearchParams encodes colons as %3A and spaces as +,
  // but Canva expects unencoded colons in scope and %20 for spaces.
  const authUrl =
    "https://www.canva.com/api/oauth/authorize" +
    "?code_challenge_method=S256" +
    "&response_type=code" +
    "&prompt=consent" +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes.replace(/ /g, "%20")}` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}`;

  return Response.redirect(authUrl, 302);
});

function generateCodeVerifier(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

function generateRandom(bytes: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

function base64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
