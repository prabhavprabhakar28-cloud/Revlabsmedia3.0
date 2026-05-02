-- ============================================================
-- REVLABS MEDIA — Platform Upgrade Migration 001
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ADD REALTIME FOR PROFILES (fixes admin users not updating)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- already in publication, ignore
  END;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. ENHANCE REPORTS TABLE (add workflow stages + metadata)
-- ─────────────────────────────────────────────────────────────
-- Add missing columns to reports if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='workflow_stage') THEN
    ALTER TABLE public.reports ADD COLUMN workflow_stage TEXT NOT NULL DEFAULT 'pending'
      CHECK (workflow_stage IN ('pending','approved','in_editing','review','revision_requested','final_delivery','completed','cancelled'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='payment_id') THEN
    ALTER TABLE public.reports ADD COLUMN payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='service_type') THEN
    ALTER TABLE public.reports ADD COLUMN service_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='deadline') THEN
    ALTER TABLE public.reports ADD COLUMN deadline TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='assigned_to') THEN
    ALTER TABLE public.reports ADD COLUMN assigned_to TEXT; -- team member name/email
  END IF;
END $$;

-- Sync status → workflow_stage for existing records
UPDATE public.reports SET workflow_stage = status WHERE workflow_stage = 'pending' AND status != 'pending';

-- Realtime for reports (may already be included)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. PROJECT FILES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_type   TEXT,              -- 'upload' | 'drive' | 'dropbox'
  file_url    TEXT NOT NULL,     -- storage URL or external link
  file_size   BIGINT,            -- bytes, null for external links
  mime_type   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_files_report_id_idx ON public.project_files(report_id);
CREATE INDEX IF NOT EXISTS project_files_user_id_idx   ON public.project_files(user_id);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project files"   ON public.project_files;
DROP POLICY IF EXISTS "Users can insert own project files" ON public.project_files;
DROP POLICY IF EXISTS "Admins can view all project files"  ON public.project_files;
DROP POLICY IF EXISTS "Users can delete own project files" ON public.project_files;

CREATE POLICY "Users can view own project files"
  ON public.project_files FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project files"
  ON public.project_files FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project files"
  ON public.project_files FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all project files"
  ON public.project_files FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage project files"
  ON public.project_files FOR ALL USING (public.is_admin());

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_files;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. PROJECT INSTRUCTIONS TABLE (versioned)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_instructions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  version      INTEGER NOT NULL DEFAULT 1,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_instructions_report_id_idx ON public.project_instructions(report_id);

ALTER TABLE public.project_instructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own instructions"    ON public.project_instructions;
DROP POLICY IF EXISTS "Users can insert own instructions"  ON public.project_instructions;
DROP POLICY IF EXISTS "Users can update own instructions"  ON public.project_instructions;
DROP POLICY IF EXISTS "Admins can view all instructions"   ON public.project_instructions;
DROP POLICY IF EXISTS "Admins can manage all instructions" ON public.project_instructions;

CREATE POLICY "Users can view own instructions"
  ON public.project_instructions FOR SELECT USING (auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can insert own instructions"
  ON public.project_instructions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instructions"
  ON public.project_instructions FOR UPDATE USING (auth.uid() = user_id AND is_admin_reply = false);

CREATE POLICY "Admins can view all instructions"
  ON public.project_instructions FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all instructions"
  ON public.project_instructions FOR ALL USING (public.is_admin());

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_instructions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. MEETINGS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meetings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id      UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  meeting_type   TEXT NOT NULL DEFAULT 'discovery'
    CHECK (meeting_type IN ('discovery','onboarding','revision','general')),
  scheduled_at   TIMESTAMPTZ NOT NULL,
  duration_mins  INTEGER NOT NULL DEFAULT 30,
  status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled','completed')),
  meet_link      TEXT,   -- Google Meet or Zoom link set by admin
  client_notes   TEXT,
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meetings_user_id_idx     ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS meetings_scheduled_at_idx ON public.meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS meetings_status_idx       ON public.meetings(status);

CREATE OR REPLACE TRIGGER on_meetings_updated
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meetings"    ON public.meetings;
DROP POLICY IF EXISTS "Users can create own meetings"  ON public.meetings;
DROP POLICY IF EXISTS "Admins can manage all meetings" ON public.meetings;

CREATE POLICY "Users can view own meetings"
  ON public.meetings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meetings"
  ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
  ON public.meetings FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all meetings"
  ON public.meetings FOR ALL USING (public.is_admin());

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. NOTIFICATIONS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- 'payment_success'|'payment_failed'|'status_update'|'file_upload'|'meeting_confirmed'|'admin_reply'
  title       TEXT NOT NULL,
  message     TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  related_id  UUID,    -- report_id or payment_id
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications"    ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications"  ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert any notification"  ON public.notifications;
DROP POLICY IF EXISTS "Service can insert notifications"    ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert any notification"
  ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

-- Allow users to insert their own notifications (for system events)
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 7. AUDIT LOG TABLE (immutable payment/financial log)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,  -- 'payment_created'|'payment_captured'|'payment_failed'|'refund_issued'|'status_changed'
  entity_type     TEXT NOT NULL,  -- 'payment'|'report'|'user'
  entity_id       UUID NOT NULL,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  old_value       JSONB,
  new_value       JSONB,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_entity_id_idx   ON public.audit_log(entity_id);
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx     ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_event_type_idx  ON public.audit_log(event_type);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx  ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log"  ON public.audit_log;
DROP POLICY IF EXISTS "Service role can insert audit log" ON public.audit_log;

-- Only admins can read the audit log
CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT USING (public.is_admin());

-- Only service role (webhooks) and admins can insert — enforced at app layer
-- RLS insert policy allows no one (service_role bypasses RLS)

-- ─────────────────────────────────────────────────────────────
-- 8. LAST_ACTIVE tracking on profiles
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_active') THEN
    ALTER TABLE public.profiles ADD COLUMN last_active TIMESTAMPTZ;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 9. ENABLE REALTIME for payments (may already exist)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================
-- DONE — Run verification queries:
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- ============================================================
