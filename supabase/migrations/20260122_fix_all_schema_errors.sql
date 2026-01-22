-- Comprehensive Fix for Recursion and Missing Table Errors

-- 1. FIX USER_ROLES RECURSION (Critical)
DROP POLICY IF EXISTS "View Roles" ON public.user_roles;
DROP POLICY IF EXISTS "Manage Roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Pengerusi can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.user_roles;
DROP POLICY IF EXISTS "Enable update for admins" ON public.user_roles;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.user_roles;

-- Safe View Policy (No Recursion)
CREATE POLICY "Enable read access for all users" ON public.user_roles
FOR SELECT TO authenticated USING (true);

-- Safe Write Policies
CREATE POLICY "Enable insert for admins" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('pengerusi', 'naib_pengerusi', 'setiausaha')));

CREATE POLICY "Enable update for admins" ON public.user_roles
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('pengerusi', 'naib_pengerusi', 'setiausaha')));

CREATE POLICY "Enable delete for admins" ON public.user_roles
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('pengerusi', 'naib_pengerusi')));


-- 2. ENSURE YURAN_BULANAN EXISTS
CREATE TABLE IF NOT EXISTS public.yuran_bulanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tahun INTEGER NOT NULL,
  bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
  jumlah DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  tarikh_bayar TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'belum_bayar' NOT NULL,
  rujukan_bayaran TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, tahun, bulan)
);

-- 3. FIX YURAN_BULANAN POLICIES
ALTER TABLE public.yuran_bulanan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own yuran bulanan" ON public.yuran_bulanan;
DROP POLICY IF EXISTS "Admins can view all yuran bulanan" ON public.yuran_bulanan;
DROP POLICY IF EXISTS "Users can insert their own yuran bulanan" ON public.yuran_bulanan;
DROP POLICY IF EXISTS "Bendahari can manage yuran bulanan" ON public.yuran_bulanan;
DROP POLICY IF EXISTS "Pengerusi can manage yuran bulanan" ON public.yuran_bulanan;
DROP POLICY IF EXISTS "Admins can update yuran bulanan" ON public.yuran_bulanan;

-- Simple View Policy: Own data OR Admins
CREATE POLICY "View Yuran Bulanan" ON public.yuran_bulanan
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('pengerusi', 'naib_pengerusi', 'bendahari', 'ajk'))
);

-- Manage Policy: Admins
CREATE POLICY "Manage Yuran Bulanan" ON public.yuran_bulanan
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('pengerusi', 'naib_pengerusi', 'bendahari'))
);

-- 4. GRANT PERMISSIONS (Fix 404/403 errors)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
