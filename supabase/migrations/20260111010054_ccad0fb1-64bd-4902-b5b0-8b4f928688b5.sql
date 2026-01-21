-- Create aktiviti table for community events
CREATE TABLE public.aktiviti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tajuk TEXT NOT NULL,
  deskripsi TEXT,
  lokasi TEXT,
  tarikh_mula TIMESTAMP WITH TIME ZONE NOT NULL,
  tarikh_tamat TIMESTAMP WITH TIME ZONE NOT NULL,
  max_peserta INTEGER,
  yuran NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'aktif',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pendaftaran_aktiviti table for event registrations
CREATE TABLE public.pendaftaran_aktiviti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aktiviti_id UUID NOT NULL REFERENCES public.aktiviti(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(aktiviti_id, user_id)
);

-- Enable RLS
ALTER TABLE public.aktiviti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftaran_aktiviti ENABLE ROW LEVEL SECURITY;

-- RLS policies for aktiviti (events are viewable by all authenticated users)
CREATE POLICY "Aktiviti viewable by authenticated users"
ON public.aktiviti FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage aktiviti"
ON public.aktiviti FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('pengerusi', 'bendahari', 'ajk')
  )
);

-- RLS policies for pendaftaran_aktiviti
CREATE POLICY "Users can view their own registrations"
ON public.pendaftaran_aktiviti FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all registrations"
ON public.pendaftaran_aktiviti FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('pengerusi', 'bendahari', 'ajk')
  )
);

CREATE POLICY "Users can register for activities"
ON public.pendaftaran_aktiviti FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel their registration"
ON public.pendaftaran_aktiviti FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all registrations"
ON public.pendaftaran_aktiviti FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('pengerusi', 'bendahari', 'ajk')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_aktiviti_updated_at
BEFORE UPDATE ON public.aktiviti
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.aktiviti;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pendaftaran_aktiviti;