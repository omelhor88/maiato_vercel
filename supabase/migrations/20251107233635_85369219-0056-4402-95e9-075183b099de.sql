-- Add mobile_key column to customers table
ALTER TABLE public.customers 
ADD COLUMN mobile_key text;

COMMENT ON COLUMN public.customers.mobile_key IS 'Chave Móvel Digital do cliente';