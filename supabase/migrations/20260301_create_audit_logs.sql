-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT
    USING (is_admin(auth.uid()));

-- Policy: System and admins can insert audit logs
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

-- Function to automatically log changes (optional but good for data integrity)
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (admin_id, action, entity_type, entity_id, old_data, new_data)
        VALUES (auth.uid(), 'UPDATE', 'profiles', OLD.id::text, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (admin_id, action, entity_type, entity_id, old_data)
        VALUES (auth.uid(), 'DELETE', 'profiles', OLD.id::text, to_jsonb(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profiles table
-- DROP TRIGGER IF EXISTS on_profile_change ON public.profiles;
-- CREATE TRIGGER on_profile_change
-- AFTER UPDATE OR DELETE ON public.profiles
-- FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

COMMENT ON TABLE public.audit_logs IS 'Merekodkan setiap aktiviti admin untuk tujuan ketelusan.';
