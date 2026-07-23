-- Temporary store for PKCE state during OAuth flow (cleaned up after use)
CREATE TABLE IF NOT EXISTS canva_oauth_states (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state       TEXT UNIQUE NOT NULL,
  code_verifier TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Single global row storing the Canva OAuth tokens for this integration
CREATE TABLE IF NOT EXISTS canva_tokens (
  id            TEXT PRIMARY KEY DEFAULT 'global',
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
