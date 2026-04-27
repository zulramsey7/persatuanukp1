-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.yuran_masuk;
ALTER PUBLICATION supabase_realtime ADD TABLE public.yuran_keluar;
ALTER PUBLICATION supabase_realtime ADD TABLE public.galeri_aktiviti;
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;