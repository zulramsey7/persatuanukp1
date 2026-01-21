-- 1. Update the check_access function to be absolutely permissive for directory viewing
CREATE OR REPLACE FUNCTION public.check_access(_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- If not logged in, deny
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- View Members (Directory) - ALLOW ALL AUTHENTICATED USERS
  IF _permission = 'view_members' THEN
    RETURN TRUE;
  END IF;
  
  -- Pengerusi has full access
  IF _permission = 'full_access' OR _permission = 'delete' THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role = 'pengerusi');
  END IF;
  
  -- Manage Members - Pengerusi, Naib Pengerusi, Setiausaha, Pen. Setiausaha
  IF _permission = 'manage_members' THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role IN ('pengerusi', 'naib_pengerusi', 'setiausaha', 'penolong_setiausaha'));
  END IF;
  
  -- Manage Finance - Pengerusi, Naib Pengerusi, Bendahari
  IF _permission = 'manage_finance' THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role IN ('pengerusi', 'naib_pengerusi', 'bendahari'));
  END IF;
  
  -- Manage Content - Pengerusi, Naib Pengerusi, AJK
  IF _permission = 'manage_content' THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role IN ('pengerusi', 'naib_pengerusi', 'ajk'));
  END IF;

  RETURN FALSE;
END;
$$;

-- 2. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "View Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Delete Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "View Roles" ON public.user_roles;
DROP POLICY IF EXISTS "Manage Roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- 3. Recreate Policies using the updated check_access function

-- PROFILES
CREATE POLICY "View Profiles" ON public.profiles FOR SELECT
USING (
  -- Users can always see themselves OR if they have view_members permission (which everyone has now)
  id = auth.uid() OR public.check_access('view_members')
);

CREATE POLICY "Insert Profiles" ON public.profiles FOR INSERT
WITH CHECK (
  id = auth.uid() OR public.check_access('manage_members')
);

CREATE POLICY "Update Profiles" ON public.profiles FOR UPDATE
USING (
  id = auth.uid() OR public.check_access('manage_members')
);

CREATE POLICY "Delete Profiles" ON public.profiles FOR DELETE
USING (
  public.check_access('delete')
);

-- USER ROLES
CREATE POLICY "View Roles" ON public.user_roles FOR SELECT
USING (
  user_id = auth.uid() OR public.check_access('view_members')
);

CREATE POLICY "Manage Roles" ON public.user_roles FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('pengerusi', 'naib_pengerusi'))
);

-- 4. Grant permissions (just in case)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
