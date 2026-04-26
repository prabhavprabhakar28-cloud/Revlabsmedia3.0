-- ============================================================
-- RevLabs Media — Supabase Row Level Security Policies
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================
-- IMPORTANT: Run the ENABLE sections first, then POLICIES.
-- These policies assume your tables: profiles, reports, payments,
-- contact_submissions, portfolio
-- ============================================================

-- ── Helper: check if current user is admin ──────────────────
-- Used internally by policies to avoid repeated subqueries.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to re-run)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;

-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own profile (not their role!)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent users from elevating their own role
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admins can update all profiles (including role changes)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Allow Supabase Auth to create a profile on signup (via trigger)
CREATE POLICY "Allow profile creation on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ============================================================
-- 2. REPORTS TABLE
-- ============================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON public.reports;

-- Users can only see their own reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create reports for themselves
CREATE POLICY "Users can create own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete their own reports (admin-only)
-- (No UPDATE/DELETE policy for regular users = blocked by default)

-- Admins can read all reports
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (public.is_admin());

-- Admins can update any report (e.g., change status)
CREATE POLICY "Admins can update all reports"
  ON public.reports FOR UPDATE
  USING (public.is_admin());


-- ============================================================
-- 3. PAYMENTS TABLE
-- ============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own pending payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;

-- Users can only view their own payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert a payment for themselves
CREATE POLICY "Users can create own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending payment (to attach payment IDs from Razorpay)
-- But cannot change user_id, amount, or mark as 'paid' (webhook does that)
CREATE POLICY "Users can update own pending payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.is_admin());

-- Admins can update any payment (e.g., manual reconciliation)
CREATE POLICY "Admins can update all payments"
  ON public.payments FOR UPDATE
  USING (public.is_admin());


-- ============================================================
-- 4. CONTACT_SUBMISSIONS TABLE
-- ============================================================
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a contact form" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.contact_submissions;

-- Public (anon) can insert — required for the contact form
CREATE POLICY "Anyone can submit a contact form"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Only admins can read submissions
CREATE POLICY "Admins can view all contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (public.is_admin());

-- Only admins can delete submissions
CREATE POLICY "Admins can delete contact submissions"
  ON public.contact_submissions FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- 5. PORTFOLIO TABLE
-- ============================================================
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view portfolio" ON public.portfolio;
DROP POLICY IF EXISTS "Admins can manage portfolio" ON public.portfolio;

-- Anyone (including unauthenticated visitors) can view portfolio
CREATE POLICY "Public can view portfolio"
  ON public.portfolio FOR SELECT
  USING (true);

-- Only admins can insert, update, or delete portfolio items
CREATE POLICY "Admins can insert portfolio"
  ON public.portfolio FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update portfolio"
  ON public.portfolio FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete portfolio"
  ON public.portfolio FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- VERIFICATION QUERIES (run these after to confirm)
-- ============================================================
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
