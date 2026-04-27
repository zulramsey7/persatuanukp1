-- Add fcm_token column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Create an index for faster lookups when sending push notifications
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON public.profiles(fcm_token) WHERE fcm_token IS NOT NULL;
