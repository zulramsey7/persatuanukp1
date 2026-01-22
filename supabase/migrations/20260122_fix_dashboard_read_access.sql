-- Fix RLS Policies to allow Dashboard Stats to work for all users (including Ahli)
-- This allows "Ahli" to see global stats (Total Collection) on the dashboard without 404 errors.

-- 1. Yuran Bulanan: Allow read access for all authenticated users
-- Previous policy restricted "Ahli" to only their own data, causing 404/Empty charts for global stats.
ALTER TABLE public.yuran_bulanan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View Yuran Bulanan" ON public.yuran_bulanan;
DROP POLICY IF EXISTS "Users can view their own yuran bulanan" ON public.yuran_bulanan;
DROP POLICY IF EXISTS "Admins can view all yuran bulanan" ON public.yuran_bulanan;

CREATE POLICY "View Yuran Bulanan" ON public.yuran_bulanan
FOR SELECT TO authenticated
USING (true);

-- 2. Yuran Masuk: Allow read access for all authenticated users
-- Fixes dashboard stats for Yuran Masuk as well.
ALTER TABLE public.yuran_masuk ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own yuran masuk" ON public.yuran_masuk;
DROP POLICY IF EXISTS "Admins can view all yuran masuk" ON public.yuran_masuk;

CREATE POLICY "View Yuran Masuk" ON public.yuran_masuk
FOR SELECT TO authenticated
USING (true);

-- 3. Ensure Permissions are granted (Explicitly)
GRANT SELECT ON public.yuran_bulanan TO authenticated;
GRANT SELECT ON public.yuran_masuk TO authenticated;
