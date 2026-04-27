-- Create documents table
CREATE TABLE public.dokumen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tajuk TEXT NOT NULL,
  deskripsi TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  kategori TEXT DEFAULT 'lain-lain',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dokumen ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view documents
CREATE POLICY "Authenticated users can view documents"
ON public.dokumen
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage documents
CREATE POLICY "Admins can insert documents"
ON public.dokumen
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update documents"
ON public.dokumen
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete documents"
ON public.dokumen
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_dokumen_updated_at
BEFORE UPDATE ON public.dokumen
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumen', 'dokumen', true);

-- Storage policies
CREATE POLICY "Anyone can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'dokumen');

CREATE POLICY "Admins can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dokumen' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'dokumen' AND public.is_admin(auth.uid()));