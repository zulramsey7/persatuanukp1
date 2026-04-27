-- Dana Masuk table for general income (donations, contributions, etc.)
CREATE TABLE public.dana_masuk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tajuk TEXT NOT NULL,
  jumlah DECIMAL(10,2) NOT NULL,
  sumber TEXT NOT NULL DEFAULT 'derma', -- derma, sumbangan, lain-lain
  deskripsi TEXT,
  tarikh DATE NOT NULL DEFAULT CURRENT_DATE,
  bukti_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.dana_masuk ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dana_masuk
CREATE POLICY "Semua ahli boleh lihat dana masuk" 
ON public.dana_masuk 
FOR SELECT 
USING (true);

CREATE POLICY "Bendahari boleh urus dana masuk" 
ON public.dana_masuk 
FOR ALL 
USING (public.has_role(auth.uid(), 'bendahari'))
WITH CHECK (public.has_role(auth.uid(), 'bendahari'));

CREATE POLICY "Pengerusi boleh urus dana masuk" 
ON public.dana_masuk 
FOR ALL 
USING (public.has_role(auth.uid(), 'pengerusi'))
WITH CHECK (public.has_role(auth.uid(), 'pengerusi'));