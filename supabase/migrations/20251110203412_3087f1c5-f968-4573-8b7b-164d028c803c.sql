-- Create reference tables for insurance system

-- Table for insurance mediators/companies
CREATE TABLE IF NOT EXISTS public.insurance_mediators (
  codigo TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo_mediador TEXT,
  logotipo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.insurance_mediators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mediators"
ON public.insurance_mediators FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create mediators"
ON public.insurance_mediators FOR INSERT
TO authenticated
WITH CHECK (true);

-- Table for insurance products
CREATE TABLE IF NOT EXISTS public.insurance_products (
  numero_produto TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.insurance_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
ON public.insurance_products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create products"
ON public.insurance_products FOR INSERT
TO authenticated
WITH CHECK (true);

-- Table for insured persons
CREATE TABLE IF NOT EXISTS public.insured_persons (
  bi TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.insured_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view insured persons"
ON public.insured_persons FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create insured persons"
ON public.insured_persons FOR INSERT
TO authenticated
WITH CHECK (true);

-- Table for angariadores (agents)
CREATE TABLE IF NOT EXISTS public.angariadores (
  numero_angariador TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  morada TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.angariadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view angariadores"
ON public.angariadores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create angariadores"
ON public.angariadores FOR INSERT
TO authenticated
WITH CHECK (true);

-- Table for months
CREATE TABLE IF NOT EXISTS public.insurance_months (
  numero INTEGER PRIMARY KEY,
  mes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.insurance_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view months"
ON public.insurance_months FOR SELECT
TO authenticated
USING (true);

-- Insert default months
INSERT INTO public.insurance_months (numero, mes) VALUES
  (1, 'Janeiro'), (2, 'Fevereiro'), (3, 'Março'),
  (4, 'Abril'), (5, 'Maio'), (6, 'Junho'),
  (7, 'Julho'), (8, 'Agosto'), (9, 'Setembro'),
  (10, 'Outubro'), (11, 'Novembro'), (12, 'Dezembro')
ON CONFLICT (numero) DO NOTHING;

-- Table for sub-angariadores
CREATE TABLE IF NOT EXISTS public.subangariadores (
  subanga_codigo TEXT PRIMARY KEY,
  subanga_nome TEXT NOT NULL,
  subanga_morada TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.subangariadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subangariadores"
ON public.subangariadores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create subangariadores"
ON public.subangariadores FOR INSERT
TO authenticated
WITH CHECK (true);

-- Table for vehicle brands
CREATE TABLE IF NOT EXISTS public.vehicle_brands (
  codigo_marca TEXT PRIMARY KEY,
  marca TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view brands"
ON public.vehicle_brands FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create brands"
ON public.vehicle_brands FOR INSERT
TO authenticated
WITH CHECK (true);

-- Table for insurance states
CREATE TABLE IF NOT EXISTS public.insurance_states (
  codigo_estado TEXT PRIMARY KEY,
  estado TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.insurance_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view states"
ON public.insurance_states FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create states"
ON public.insurance_states FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default states
INSERT INTO public.insurance_states (codigo_estado, estado) VALUES
  ('ATIVO', 'Ativo'),
  ('CANCELADO', 'Cancelado'),
  ('SUSPENSO', 'Suspenso'),
  ('RENOVADO', 'Renovado')
ON CONFLICT (codigo_estado) DO NOTHING;

-- Table for payment types
CREATE TABLE IF NOT EXISTS public.payment_types (
  codigo_pagamento TEXT PRIMARY KEY,
  tipo_pagamento TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payment types"
ON public.payment_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create payment types"
ON public.payment_types FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default payment types
INSERT INTO public.payment_types (codigo_pagamento, tipo_pagamento) VALUES
  ('CARTAO', 'Cartão'),
  ('MB', 'Multibanco'),
  ('TRANSFERENCIA', 'Transferência'),
  ('NUMERARIO', 'Numerário'),
  ('DEBITO_DIRETO', 'Débito Direto')
ON CONFLICT (codigo_pagamento) DO NOTHING;

-- Drop existing insurance table and recreate with new structure
DROP TABLE IF EXISTS public.insurance CASCADE;

CREATE TABLE public.insurance (
  numero UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nif TEXT,
  codigo_mediador TEXT REFERENCES public.insurance_mediators(codigo),
  numero_apolice TEXT,
  numero_produto TEXT REFERENCES public.insurance_products(numero_produto),
  bi TEXT REFERENCES public.insured_persons(bi),
  numero_angariador TEXT REFERENCES public.angariadores(numero_angariador),
  numero_mes INTEGER REFERENCES public.insurance_months(numero),
  data_vencimento DATE,
  matricula TEXT,
  subanga_codigo TEXT REFERENCES public.subangariadores(subanga_codigo),
  codigo_marca TEXT REFERENCES public.vehicle_brands(codigo_marca),
  codigo_estado TEXT REFERENCES public.insurance_states(codigo_estado),
  data_emissao_seg DATE,
  seguro_novo_apresent BOOLEAN DEFAULT false,
  data_cancelamento DATE,
  codigo_pagamento TEXT REFERENCES public.payment_types(codigo_pagamento),
  data_ultima_alteracao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  visto BOOLEAN DEFAULT false,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.insurance ENABLE ROW LEVEL SECURITY;

-- RLS policies for insurance table
CREATE POLICY "Employees and admins can view insurance"
ON public.insurance FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees and admins can create insurance"
ON public.insurance FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees and admins can update insurance"
ON public.insurance FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Only admins can delete insurance"
ON public.insurance FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_insurance_updated_at
BEFORE UPDATE ON public.insurance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();