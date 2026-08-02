-- S21: DB-backed idempotency keys
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id          BIGSERIAL PRIMARY KEY,
  cache_key   TEXT        NOT NULL UNIQUE,
  status_code INT         NOT NULL,
  response_body JSONB     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idempotency_keys_expires_idx
  ON idempotency_keys (expires_at);

-- S21: renewal_occurrences table for calendar API
CREATE TABLE IF NOT EXISTS renewal_occurrences (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID        NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL,
  type            TEXT        NOT NULL DEFAULT 'RENEWAL',
  scheduled_at    TIMESTAMPTZ NOT NULL,
  expected_amount TEXT,
  currency        TEXT,
  status          TEXT        NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS renewal_occurrences_user_scheduled_idx
  ON renewal_occurrences (user_id, scheduled_at);

CREATE INDEX IF NOT EXISTS renewal_occurrences_subscription_idx
  ON renewal_occurrences (subscription_id);

-- S22: exports table (was assumed to exist, make explicit)
CREATE TABLE IF NOT EXISTS exports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'PENDING',
  download_url TEXT,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- S22: rename device_tokens.encrypted_token → token (the column was storing plaintext)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_tokens' AND column_name = 'encrypted_token'
  ) THEN
    ALTER TABLE device_tokens RENAME COLUMN encrypted_token TO token;
  END IF;
END $$;
