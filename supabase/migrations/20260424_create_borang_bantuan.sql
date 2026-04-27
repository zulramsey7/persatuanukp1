-- Create table for aid forms (created by admin)
CREATE TABLE public.borang_bantuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tajuk TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT NOT NULL, -- e.g., 'kewangan', 'perubatan', 'pendidikan', 'bencana', 'lain-lain'
  soalan JSONB DEFAULT '[]'::jsonb, -- Array of questions with field types (kept for compatibility but not used)
  tarikh_mula TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  tarikh_tamat TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'aktif' NOT NULL, -- 'aktif', 'tamat', 'draf'
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create table for aid applications (submitted by members)
CREATE TABLE public.permohonan_bantuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borang_id UUID REFERENCES public.borang_bantuan(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jawapan JSONB NOT NULL DEFAULT '{}'::jsonb, -- Answers to the form questions
  status TEXT DEFAULT 'dalam_semakan' NOT NULL, -- 'dalam_semakan', 'diluluskan', 'ditolak', 'memerlukan_maklumat'
  catatan_admin TEXT,
  tarikh_mohon TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  tarikh_proses TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (borang_id, user_id)
);

-- Enable RLS
ALTER TABLE public.borang_bantuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permohonan_bantuan ENABLE ROW LEVEL SECURITY;

-- RLS Policies for borang_bantuan
CREATE POLICY "Admins can view all borang_bantuan"
  ON public.borang_bantuan FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Active members can view active borang_bantuan"
  ON public.borang_bantuan FOR SELECT
  TO authenticated
  USING (status = 'aktif' AND tarikh_mula <= now() AND tarikh_tamat >= now());

CREATE POLICY "Admins can create borang_bantuan"
  ON public.borang_bantuan FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update borang_bantuan"
  ON public.borang_bantuan FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete borang_bantuan"
  ON public.borang_bantuan FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- RLS Policies for permohonan_bantuan
CREATE POLICY "Users can view their own permohonan_bantuan"
  ON public.permohonan_bantuan FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all permohonan_bantuan"
  ON public.permohonan_bantuan FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own permohonan_bantuan"
  ON public.permohonan_bantuan FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update permohonan_bantuan"
  ON public.permohonan_bantuan FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete permohonan_bantuan"
  ON public.permohonan_bantuan FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Trigger to update updated_at for borang_bantuan
CREATE TRIGGER update_borang_bantuan_updated_at
  BEFORE UPDATE ON public.borang_bantuan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at for permohonan_bantuan
CREATE TRIGGER update_permohonan_bantuan_updated_at
  BEFORE UPDATE ON public.permohonan_bantuan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to generate WhatsApp link for a form
CREATE OR REPLACE FUNCTION public.get_whatsapp_link(borang_id UUID, phone_number TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'https://wa.me/?text=' || encode(convert_to(
    'Assalamualaikum, saya berminat untuk memohon bantuan. Sila layari borang di: ' || 
    current_setting('app.base_url', true) || '/borang-bantuan/' || borang_id::text,
    'UTF-8'
  ), 'base64');
$$;
