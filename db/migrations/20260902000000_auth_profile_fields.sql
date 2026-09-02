-- SCRUM-69: persist sign-up profile + company fields on the existing schema.
-- Additive: safe to run on a project that already applied 20240207000000_complete_setup.sql.
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
    ADD COLUMN IF NOT EXISTS industry VARCHAR(100);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    meta_full_name text;
BEGIN
    meta_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NULLIF(
            concat_ws(
                ' ',
                NEW.raw_user_meta_data->>'first_name',
                NEW.raw_user_meta_data->>'last_name'
            ),
            ''
        ),
        NEW.raw_user_meta_data->>'name'
    );

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        first_name,
        last_name,
        phone_number,
        job_title
    )
    VALUES (
        NEW.id,
        NEW.email,
        meta_full_name,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'job_title'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;
