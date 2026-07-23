-- ============================================================
-- CORE APPLICATION TABLES
-- ============================================================

-- 1. COLLECTIVES (tour packages)
CREATE TABLE IF NOT EXISTS collectives (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT,
  package_code                TEXT,
  destination                 TEXT,
  travel_type                 TEXT,
  operator_name               TEXT,
  departure_date              DATE,
  return_date                 DATE,
  nights                      INTEGER,
  total_slots                 INTEGER DEFAULT 20,
  available_slots             INTEGER DEFAULT 20,
  booked_pax                  INTEGER DEFAULT 0,
  slots_for_confirmation      BOOLEAN DEFAULT FALSE,
  guaranteed_departure        BOOLEAN DEFAULT FALSE,
  base_price_currency         TEXT DEFAULT 'PHP',
  base_price_foreign          NUMERIC,
  exchange_rate               NUMERIC DEFAULT 57,
  base_price_php              NUMERIC,
  markup_amount               NUMERIC DEFAULT 0,
  selling_price               NUMERIC,
  commission_amount           NUMERIC,
  commission_currency         TEXT,
  commission_base_foreign     NUMERIC,
  commission_exchange_rate    NUMERIC,
  downpayment_required        NUMERIC DEFAULT 0,
  downpayment_base_ops        NUMERIC,
  downpayment_ops_currency    TEXT,
  downpayment_ops_rate        NUMERIC,
  downpayment_base_pd         NUMERIC,
  downpayment_pd_currency     TEXT,
  downpayment_pd_rate         NUMERIC,
  book_buy_required           NUMERIC DEFAULT 0,
  book_buy_base_ops           NUMERIC,
  book_buy_ops_currency       TEXT,
  book_buy_ops_rate           NUMERIC,
  book_buy_base_pd            NUMERIC,
  book_buy_pd_currency        TEXT,
  book_buy_pd_rate            NUMERIC,
  dp_type                     TEXT DEFAULT 'fixed',
  rate_twin                   NUMERIC,
  rate_twin_age_min           INTEGER,
  rate_twin_age_max           INTEGER,
  rate_triple                 NUMERIC,
  rate_triple_age_min         INTEGER,
  rate_triple_age_max         INTEGER,
  rate_quad                   NUMERIC,
  rate_quad_age_min           INTEGER,
  rate_quad_age_max           INTEGER,
  rate_single                 NUMERIC,
  rate_single_age_min         INTEGER,
  rate_single_age_max         INTEGER,
  rate_solo                   NUMERIC,
  rate_solo_age_min           INTEGER,
  rate_solo_age_max           INTEGER,
  rate_single_supplement      NUMERIC,
  rate_child_no_bed           NUMERIC,
  rate_child_no_bed_age_min   INTEGER,
  rate_child_no_bed_age_max   INTEGER,
  rate_child                  NUMERIC,
  rate_child_age_min          INTEGER,
  rate_child_age_max          INTEGER,
  rate_infant                 NUMERIC,
  rate_infant_age_min         INTEGER,
  rate_infant_age_max         INTEGER,
  inclusions                  TEXT,
  exclusions                  TEXT,
  cancellation_policy         TEXT,
  itinerary                   TEXT,
  terms_conditions            TEXT,
  optional_tours              TEXT,
  flight_details              TEXT,
  hotel_details               TEXT,
  remarks                     TEXT,
  drive_link                  TEXT,
  travel_dates                JSONB DEFAULT '[]',
  status                      TEXT DEFAULT 'draft',
  pipeline_stage              TEXT,
  image_url                   TEXT,
  cover_image                 TEXT,
  current_phase               INTEGER DEFAULT 1,
  current_stage               INTEGER DEFAULT 1,
  checklist_completion        NUMERIC DEFAULT 0,
  created_date                TIMESTAMPTZ DEFAULT NOW(),
  updated_date                TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CHECKLIST TASKS
CREATE TABLE IF NOT EXISTS checklist_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id    UUID REFERENCES collectives(id) ON DELETE CASCADE,
  task_name        TEXT,
  status           TEXT DEFAULT 'pending',
  department       TEXT,
  phase_number     INTEGER,
  phase_name       TEXT,
  stage_number     INTEGER,
  stage_name       TEXT,
  order_index      INTEGER DEFAULT 0,
  completion_mode  TEXT DEFAULT 'manual',
  requires_approval BOOLEAN DEFAULT FALSE,
  priority         TEXT DEFAULT 'medium',
  assigned_to      TEXT,
  notes            TEXT,
  completed_at     TIMESTAMPTZ,
  created_date     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MARKETING ASSETS
CREATE TABLE IF NOT EXISTS marketing_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id  UUID REFERENCES collectives(id) ON DELETE SET NULL,
  title          TEXT,
  asset_type     TEXT DEFAULT 'poster',
  status         TEXT DEFAULT 'draft',
  platform       JSONB DEFAULT '[]',
  file_url       TEXT,
  proof_url      TEXT,
  caption        TEXT,
  scheduled_date DATE,
  notes          TEXT,
  published_date DATE,
  created_date   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT,
  message        TEXT,
  type           TEXT DEFAULT 'info',
  priority       TEXT DEFAULT 'medium',
  is_read        BOOLEAN DEFAULT FALSE,
  department     TEXT,
  collective_id  TEXT,
  stage_number   INTEGER,
  created_date   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY — allow anon + authenticated full access
-- (internal app, no public exposure)
-- ============================================================
ALTER TABLE collectives      ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_tasks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_collectives"      ON collectives      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_checklist_tasks"  ON checklist_tasks  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_marketing_assets" ON marketing_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications"    ON notifications    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_collectives_created      ON collectives(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_collective     ON checklist_tasks(collective_id);
CREATE INDEX IF NOT EXISTS idx_checklist_department     ON checklist_tasks(department);
CREATE INDEX IF NOT EXISTS idx_marketing_collective     ON marketing_assets(collective_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created    ON notifications(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_department ON notifications(department);
