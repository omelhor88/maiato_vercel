-- Remove fax column from customers table
ALTER TABLE public.customers DROP COLUMN IF EXISTS fax;