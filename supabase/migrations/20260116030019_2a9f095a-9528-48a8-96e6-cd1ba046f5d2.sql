-- Allow Pengerusi to manage yuran_keluar (currently only Bendahari can)
CREATE POLICY "Pengerusi can manage yuran keluar"
ON public.yuran_keluar
FOR ALL
USING (has_role(auth.uid(), 'pengerusi'::app_role));