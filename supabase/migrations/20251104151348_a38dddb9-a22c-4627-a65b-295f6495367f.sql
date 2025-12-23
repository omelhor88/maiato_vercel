-- Add all missing columns to customers table to match old MySQL structure
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS phone2 text,
ADD COLUMN IF NOT EXISTS fax text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS title_code text,
ADD COLUMN IF NOT EXISTS profession_code text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS internet text,
ADD COLUMN IF NOT EXISTS spouse_internet text,
ADD COLUMN IF NOT EXISTS spouse_nif text,
ADD COLUMN IF NOT EXISTS nib text,
ADD COLUMN IF NOT EXISTS viewed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS new_customer_viewed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS niss text,
ADD COLUMN IF NOT EXISTS social_security_code text;

-- Add unique constraint on NIF to ensure no duplicates
ALTER TABLE public.customers
ADD CONSTRAINT customers_nif_unique UNIQUE (nif);

-- Add index on NIF for better search performance
CREATE INDEX IF NOT EXISTS idx_customers_nif ON public.customers(nif);