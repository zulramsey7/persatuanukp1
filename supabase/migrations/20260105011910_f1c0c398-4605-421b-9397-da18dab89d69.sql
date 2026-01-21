-- Allow Pengerusi to manage yuran_bulanan (currently only Bendahari can)
CREATE POLICY "Pengerusi can manage yuran bulanan"
ON public.yuran_bulanan
FOR ALL
USING (has_role(auth.uid(), 'pengerusi'::app_role));

-- Allow Pengerusi to manage yuran_masuk (currently only Bendahari can)
CREATE POLICY "Pengerusi can manage yuran masuk"
ON public.yuran_masuk
FOR ALL
USING (has_role(auth.uid(), 'pengerusi'::app_role));

-- Also allow admins (pengerusi, bendahari, ajk) to update yuran_bulanan for any user
CREATE POLICY "Admins can update yuran bulanan"
ON public.yuran_bulanan
FOR UPDATE
USING (is_admin(auth.uid()));

-- Also allow admins to update yuran_masuk for any user
CREATE POLICY "Admins can update yuran masuk"
ON public.yuran_masuk
FOR UPDATE
USING (is_admin(auth.uid()));