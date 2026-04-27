-- Enable Realtime for the notifications table and ensure it respects RLS
-- This adds the table to the supabase_realtime publication if it exists
-- and ensures that only changes the user is allowed to see are sent via Realtime.

-- 1. Ensure the publication exists (Supabase default)
-- (No SQL needed for checking existence, we just try to add to it)

-- 2. Add tables to the realtime publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add notifications table
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        -- Add yuran_bulanan table (already used in Kewangan.tsx with filters)
        ALTER PUBLICATION supabase_realtime ADD TABLE public.yuran_bulanan;
        -- Add aduan table (used in Aduan.tsx)
        ALTER PUBLICATION supabase_realtime ADD TABLE public.aduan;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL; -- Table already in publication
END $$;

-- 3. Ensure RLS is enabled for these tables (double check)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yuran_bulanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aduan ENABLE ROW LEVEL SECURITY;

-- 4. Verify/Re-apply policies that use auth.uid()
-- (Policies already exist in previous migrations, but we ensure they are clean)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view their own aduan" ON public.aduan;
CREATE POLICY "Users can view their own aduan"
  ON public.aduan FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
