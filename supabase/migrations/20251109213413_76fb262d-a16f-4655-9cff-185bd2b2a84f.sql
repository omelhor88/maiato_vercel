-- Create service_types table (tipo serviço)
CREATE TABLE public.service_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default service types for contabilidade
INSERT INTO public.service_types (code, name) VALUES
  ('IRS', 'IRS e derivados'),
  ('EMPRESAS_TI', 'Empresas e TI'),
  ('CONSULTORIA', 'Consultoria'),
  ('DIVERSOS', 'Diversos');

-- Enable RLS
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_types
CREATE POLICY "Authenticated users can view service types"
ON public.service_types FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create service types"
ON public.service_types FOR INSERT
WITH CHECK (true);

-- Create receipt_services table (serviços prestados)
CREATE TABLE public.receipt_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id uuid NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  service_description text NOT NULL,
  amount numeric NOT NULL,
  service_type_code text REFERENCES public.service_types(code),
  paid boolean NOT NULL DEFAULT false,
  payment_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receipt_services ENABLE ROW LEVEL SECURITY;

-- RLS policies for receipt_services
CREATE POLICY "Authenticated users can view all receipt services"
ON public.receipt_services FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create receipt services"
ON public.receipt_services FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update receipt services"
ON public.receipt_services FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete receipt services"
ON public.receipt_services FOR DELETE
USING (true);

-- Add trigger for updated_at on receipt_services
CREATE TRIGGER update_receipt_services_updated_at
BEFORE UPDATE ON public.receipt_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add additional columns to receipts table to match old structure
ALTER TABLE public.receipts
ADD COLUMN nfc text,
ADD COLUMN last_modified_date timestamp with time zone DEFAULT now(),
ADD COLUMN viewed boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.receipts.nfc IS 'NFC number if applicable';
COMMENT ON COLUMN public.receipts.last_modified_date IS 'Last modification date';
COMMENT ON COLUMN public.receipts.viewed IS 'Whether the receipt has been viewed/reviewed';