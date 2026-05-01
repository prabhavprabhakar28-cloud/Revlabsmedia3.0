-- ============================================================
-- REVLABS — COMPLETE DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast role lookups
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- ─────────────────────────────────────────────────────────────
-- 2. REPORTS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx  ON public.reports(status);

-- ─────────────────────────────────────────────────────────────
-- 3. PAYMENTS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount                NUMERIC(12, 2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'USD',
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_provider      TEXT NOT NULL DEFAULT 'razorpay' CHECK (payment_provider IN ('razorpay', 'stripe')),
  provider_order_id     TEXT,          -- Razorpay order_id / Stripe PaymentIntent id
  provider_payment_id   TEXT,          -- Razorpay payment_id after success
  provider_signature    TEXT,          -- Razorpay signature for verification
  service_type          TEXT,          -- e.g. "Video Production - Premium"
  metadata              JSONB,         -- any extra data
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx     ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx       ON public.payments(status);
CREATE INDEX IF NOT EXISTS payments_provider_order_idx ON public.payments(provider_order_id);

-- ─────────────────────────────────────────────────────────────
-- 4. UPDATED_AT TRIGGER FUNCTION
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE OR REPLACE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER on_reports_updated
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER on_payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
    SET
      full_name  = EXCLUDED.full_name,
      email      = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 6. HELPER: IS_ADMIN FUNCTION
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 7. ENABLE ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 8. PROFILES RLS POLICIES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"  ON public.profiles;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Users can insert their own profile (needed for trigger)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile (but NOT change role)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can update any profile (including role)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 9. REPORTS RLS POLICIES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reports_select_own"   ON public.reports;
DROP POLICY IF EXISTS "reports_select_admin" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_own"   ON public.reports;
DROP POLICY IF EXISTS "reports_update_own"   ON public.reports;
DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
DROP POLICY IF EXISTS "reports_delete_admin" ON public.reports;

-- Users can read their own reports
CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all reports
CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  USING (public.is_admin());

-- Users can insert their own reports
CREATE POLICY "reports_insert_own"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reports only
CREATE POLICY "reports_update_own"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any report (status changes)
CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  USING (public.is_admin());

-- Admins can delete reports
CREATE POLICY "reports_delete_admin"
  ON public.reports FOR DELETE
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 10. PAYMENTS RLS POLICIES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_select_own"   ON public.payments;
DROP POLICY IF EXISTS "payments_select_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own"   ON public.payments;
DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;

-- Users can read their own payments
CREATE POLICY "payments_select_own"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all payments
CREATE POLICY "payments_select_admin"
  ON public.payments FOR SELECT
  USING (public.is_admin());

-- Users can insert their own payment records (after initiating)
CREATE POLICY "payments_insert_own"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only backend/admin can update payment status (webhook uses service role)
CREATE POLICY "payments_update_admin"
  ON public.payments FOR UPDATE
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 11. INITIAL ADMIN SEED
-- Replace 'admin@revlabs.com' with your actual admin email
-- Run this AFTER creating your admin user account
-- ─────────────────────────────────────────────────────────────
-- UPDATE public.profiles
--   SET role = 'admin'
-- WHERE email = 'admin@revlabs.com';

-- ─────────────────────────────────────────────────────────────
-- 13. CONTACT_SUBMISSIONS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "contacts_select_admin" ON public.contact_submissions;
DROP POLICY IF EXISTS "contacts_update_admin" ON public.contact_submissions;
DROP POLICY IF EXISTS "contacts_insert_public" ON public.contact_submissions;

CREATE POLICY "contacts_select_admin" ON public.contact_submissions FOR SELECT USING (public.is_admin());
CREATE POLICY "contacts_update_admin" ON public.contact_submissions FOR UPDATE USING (public.is_admin());
CREATE POLICY "contacts_insert_public" ON public.contact_submissions FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 14. PORTFOLIO TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolio (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  category     TEXT NOT NULL, -- Video, Photo, Editorial
  format       TEXT,          -- Commercial, Campaign, etc.
  description  TEXT,
  brief        TEXT,
  team         TEXT[],
  deliverables TEXT[],
  client       TEXT,
  year         TEXT,
  quote        TEXT,
  quote_name   TEXT,
  image_url    TEXT,
  is_featured  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apply updated_at trigger
CREATE OR REPLACE TRIGGER on_portfolio_updated
  BEFORE UPDATE ON public.portfolio
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "portfolio_select_public" ON public.portfolio;
DROP POLICY IF EXISTS "portfolio_all_admin"     ON public.portfolio;

CREATE POLICY "portfolio_select_public" ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "portfolio_all_admin"     ON public.portfolio FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 15. REALTIME PUBLICATION (Updated)
-- ─────────────────────────────────────────────────────────────
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio;
COMMIT;
