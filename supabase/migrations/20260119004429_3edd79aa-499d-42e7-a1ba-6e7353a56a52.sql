-- Add no_ahli column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN no_ahli INTEGER;

-- Update existing profiles with sequential numbers based on registration order
WITH numbered_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.profiles
)
UPDATE public.profiles p
SET no_ahli = np.row_num
FROM numbered_profiles np
WHERE p.id = np.id;

-- Make the column NOT NULL after populating existing data
ALTER TABLE public.profiles 
ALTER COLUMN no_ahli SET NOT NULL;

-- Create unique index for no_ahli
CREATE UNIQUE INDEX idx_profiles_no_ahli ON public.profiles(no_ahli);

-- Create sequence for auto-increment
CREATE SEQUENCE IF NOT EXISTS profiles_no_ahli_seq;

-- Set sequence to continue from the highest no_ahli
SELECT setval('profiles_no_ahli_seq', COALESCE((SELECT MAX(no_ahli) FROM public.profiles), 0));

-- Set default value for new profiles
ALTER TABLE public.profiles 
ALTER COLUMN no_ahli SET DEFAULT nextval('profiles_no_ahli_seq');