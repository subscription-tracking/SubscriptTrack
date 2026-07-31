-- SubscriptTrack — Initial Schema
-- Supabase PostgreSQL üzerinde çalıştırılır.
-- Supabase Auth kullanıldığı için users tablosu auth.users'a referans verir.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- ─── USERS ────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       CITEXT,
  status      VARCHAR(24) NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE','DELETION_PENDING','DELETED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name           VARCHAR(100),
  last_name            VARCHAR(100),
  preferred_currency   CHAR(3) NOT NULL DEFAULT 'TRY',
  timezone             VARCHAR(64) NOT NULL DEFAULT 'Europe/Istanbul',
  locale               VARCHAR(16) NOT NULL DEFAULT 'tr-TR',
  theme                VARCHAR(16) NOT NULL DEFAULT 'SYSTEM'
                         CHECK (theme IN ('SYSTEM','LIGHT','DARK')),
  default_notify_days  SMALLINT NOT NULL DEFAULT 3 CHECK (default_notify_days BETWEEN 0 AND 30),
  push_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled        BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             VARCHAR(32) UNIQUE NOT NULL,
  display_name_key VARCHAR(100) NOT NULL,
  icon_key         VARCHAR(64) NOT NULL,
  sort_order       SMALLINT NOT NULL,
  is_system        BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO categories (code, display_name_key, icon_key, sort_order) VALUES
  ('ENTERTAINMENT', 'category.entertainment', 'tv',         1),
  ('MUSIC',         'category.music',         'music',      2),
  ('SOFTWARE',      'category.software',      'code',       3),
  ('CLOUD',         'category.cloud',         'cloud',      4),
  ('EDUCATION',     'category.education',     'book-open',  5),
  ('BUSINESS',      'category.business',      'briefcase',  6),
  ('HEALTH',        'category.health',        'heart',      7),
  ('GAMING',        'category.gaming',        'gamepad-2',  8),
  ('OTHER',         'category.other',         'tag',        9);

-- ─── SERVICES ─────────────────────────────────────────────────────────────────

CREATE TABLE services (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              VARCHAR(120) UNIQUE NOT NULL,
  name              VARCHAR(160) NOT NULL,
  logo_url          TEXT,
  website_url       TEXT,
  account_url       TEXT,
  cancellation_url  TEXT,
  category_id       UUID REFERENCES categories(id),
  last_verified_at  TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────

CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id            UUID REFERENCES services(id),
  category_id           UUID NOT NULL REFERENCES categories(id),
  name                  VARCHAR(160) NOT NULL,
  status                VARCHAR(24) NOT NULL DEFAULT 'ACTIVE'
                          CHECK (status IN ('TRIAL','ACTIVE','PAUSED','CANCELLED','EXPIRED','ARCHIVED')),
  website_url           TEXT,
  account_url           TEXT,
  cancellation_url      TEXT,
  note                  TEXT CHECK (char_length(note) <= 2000),
  payment_method_label  VARCHAR(80),
  trial_end_at          TIMESTAMPTZ,
  regular_amount        NUMERIC(19,4),
  cancelled_at          TIMESTAMPTZ,
  access_ends_at        TIMESTAMPTZ,
  archived_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_user_updated ON subscriptions(user_id, updated_at DESC);
CREATE INDEX idx_subscriptions_user_category ON subscriptions(user_id, category_id);

-- ─── BILLING SCHEDULES ────────────────────────────────────────────────────────

CREATE TABLE billing_schedules (
  subscription_id  UUID PRIMARY KEY REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount           NUMERIC(19,4) NOT NULL,
  currency         CHAR(3) NOT NULL,
  cycle            VARCHAR(24) NOT NULL
                     CHECK (cycle IN ('WEEKLY','MONTHLY','QUARTERLY','BIANNUAL','ANNUAL','CUSTOM')),
  interval_count   INTEGER,
  next_renewal_at  TIMESTAMPTZ,
  anchor_day       SMALLINT,
  timezone         VARCHAR(64) NOT NULL DEFAULT 'Europe/Istanbul'
);

-- ─── RENEWAL OCCURRENCES ──────────────────────────────────────────────────────

CREATE TABLE renewal_occurrences (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id  UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  expected_amount  NUMERIC(19,4) NOT NULL,
  currency         CHAR(3) NOT NULL,
  type             VARCHAR(24) NOT NULL CHECK (type IN ('RENEWAL','TRIAL_END')),
  status           VARCHAR(24) NOT NULL DEFAULT 'PLANNED'
                     CHECK (status IN ('PLANNED','CONFIRMED','SKIPPED','CANCELLED')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subscription_id, scheduled_at, type)
);

CREATE INDEX idx_occurrences_user_scheduled ON renewal_occurrences(user_id, scheduled_at);

-- ─── SUBSCRIPTION EVENTS ──────────────────────────────────────────────────────

CREATE TABLE subscription_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id  UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type       VARCHAR(32) NOT NULL,
  old_values       JSONB,
  new_values       JSONB,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SAVINGS EVENTS ───────────────────────────────────────────────────────────

CREATE TABLE savings_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id  UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type       VARCHAR(24) NOT NULL CHECK (event_type IN ('CANCELLED','DOWNGRADED','PAUSED')),
  monthly_amount   NUMERIC(19,4) NOT NULL,
  annual_amount    NUMERIC(19,4) NOT NULL,
  currency         CHAR(3) NOT NULL,
  effective_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id  UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  occurrence_id    UUID REFERENCES renewal_occurrences(id) ON DELETE SET NULL,
  type             VARCHAR(32) NOT NULL,
  title_key        VARCHAR(120) NOT NULL,
  body_params      JSONB NOT NULL DEFAULT '{}',
  deep_link        TEXT,
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- ─── NOTIFICATION RULES ───────────────────────────────────────────────────────

CREATE TABLE notification_rules (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id  UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type       VARCHAR(32) NOT NULL,
  channel          VARCHAR(16) NOT NULL CHECK (channel IN ('PUSH','IN_APP','EMAIL')),
  days_before      SMALLINT NOT NULL DEFAULT 3,
  local_time       TIME,
  enabled          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── NOTIFICATION DELIVERIES ──────────────────────────────────────────────────

CREATE TABLE notification_deliveries (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occurrence_id        UUID NOT NULL REFERENCES renewal_occurrences(id) ON DELETE CASCADE,
  channel              VARCHAR(16) NOT NULL CHECK (channel IN ('PUSH','EMAIL')),
  notification_type    VARCHAR(32) NOT NULL,
  status               VARCHAR(24) NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING','SENT','FAILED','DEAD')),
  attempt_count        INTEGER NOT NULL DEFAULT 0,
  provider_message_id  VARCHAR(255),
  scheduled_for        TIMESTAMPTZ NOT NULL,
  sent_at              TIMESTAMPTZ,
  last_error_code      VARCHAR(100),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (occurrence_id, channel, notification_type)
);

-- ─── DEVICE TOKENS ────────────────────────────────────────────────────────────

CREATE TABLE device_tokens (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform         VARCHAR(16) NOT NULL CHECK (platform IN ('IOS','ANDROID')),
  encrypted_token  TEXT NOT NULL UNIQUE,
  app_version      VARCHAR(32),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at       TIMESTAMPTZ
);

-- ─── EXPORTS ──────────────────────────────────────────────────────────────────

CREATE TABLE exports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(24) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','READY','EXPIRED','FAILED')),
  download_url  TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Supabase'de RLS ikinci bir güvenlik katmanı sağlar.
-- API zaten user_id filtresi uygular; RLS bunu DB seviyesinde de zorlar.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewal_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- API service role RLS'yi bypass eder; bunlar client-side için.
-- Service role key ile backend sorguları RLS'den etkilenmez.
