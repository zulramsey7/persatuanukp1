-- Update Enum and Clean Up Roles

-- 1. Update app_role enum to include all roles used in the application
-- Postgres doesn't support "ADD VALUE IF NOT EXISTS" directly in a simple way for enums in all versions, 
-- so we use a DO block to check first.
DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE 'naib_pengerusi';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE 'setiausaha';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE 'penolong_setiausaha';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Clean up "unused" roles (Assumed to be 'ahli' role rows)
-- Since 'ahli' is the default status for everyone, we don't strictly need it in user_roles 
-- if we only use user_roles for special privileges.
-- However, if you want to keep 'ahli' for users who have NO other role, you can modify the query.
-- Below query removes 'ahli' role from user_roles.
DELETE FROM public.user_roles 
WHERE role = 'ahli';

-- 3. Ensure Pengerusi/Admin roles are preserved
-- (No action needed, DELETE only targeted 'ahli')

-- 4. Verify Policy for "naib_pengerusi" etc is valid now that Enum is updated.
-- (Policies created in previous step are already correct, they just needed the Enum to support the values for INSERTs)
