-- Add member_number column to profiles table (without default initially)
-- This allows us to manually assign sequential numbers

ALTER TABLE public.profiles 
ADD COLUMN member_number INT UNIQUE;

-- Create sequence for member numbers
CREATE SEQUENCE public.member_number_seq START WITH 1 INCREMENT BY 1;

-- Update existing records with member numbers
-- This updates all existing members with sequential numbers based on created_at order
UPDATE public.profiles
SET member_number = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC)
  FROM public.profiles p2
  WHERE p2.id = public.profiles.id
)
WHERE member_number IS NULL;

-- Now set default for new inserts
ALTER TABLE public.profiles 
ALTER COLUMN member_number SET DEFAULT nextval('public.member_number_seq');

-- Make it non-nullable after populating existing records
ALTER TABLE public.profiles 
ALTER COLUMN member_number SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.member_number IS 'Sequential member number assigned at account creation. Used for digital membership card and identification.';
