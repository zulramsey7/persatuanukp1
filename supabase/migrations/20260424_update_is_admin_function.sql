-- Update is_admin function to include setiausaha and naib_pengerusi
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('pengerusi', 'setiausaha', 'naib_pengerusi', 'bendahari', 'ajk')
  )
$$;
