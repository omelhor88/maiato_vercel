-- =====================================================
-- EXPORTAÇÃO DA BASE DE DADOS - MAIATO
-- =====================================================
-- Execute este script no SQL Editor da nova Supabase
-- =====================================================

-- =====================================================
-- 1. CRIAR ENUM
-- =====================================================
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CRIAR SEQUÊNCIAS
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS angariadores_seq START 2;
CREATE SEQUENCE IF NOT EXISTS subangariadores_seq START 2;
CREATE SEQUENCE IF NOT EXISTS insurance_companies_seq START 3;
CREATE SEQUENCE IF NOT EXISTS insurance_products_seq START 2;
CREATE SEQUENCE IF NOT EXISTS insurance_mediators_seq START 2;

-- =====================================================
-- 3. CRIAR TABELAS
-- =====================================================

-- Titles
CREATE TABLE IF NOT EXISTS public.titles (
    id INTEGER NOT NULL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Professions
CREATE TABLE IF NOT EXISTS public.professions (
    id INTEGER NOT NULL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Insurance Months
CREATE TABLE IF NOT EXISTS public.insurance_months (
    numero INTEGER NOT NULL PRIMARY KEY,
    mes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insurance States
CREATE TABLE IF NOT EXISTS public.insurance_states (
    codigo_estado TEXT NOT NULL PRIMARY KEY,
    estado TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment Types
CREATE TABLE IF NOT EXISTS public.payment_types (
    codigo_pagamento TEXT NOT NULL PRIMARY KEY,
    tipo_pagamento TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Service Types
CREATE TABLE IF NOT EXISTS public.service_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vehicle Brands
CREATE TABLE IF NOT EXISTS public.vehicle_brands (
    codigo_marca TEXT NOT NULL PRIMARY KEY,
    marca TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insurance Mediators
CREATE TABLE IF NOT EXISTS public.insurance_mediators (
    bi TEXT NOT NULL DEFAULT ('MED' || lpad((nextval('insurance_mediators_seq'))::text, 5, '0')) PRIMARY KEY,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insurance Companies
CREATE TABLE IF NOT EXISTS public.insurance_companies (
    codigo TEXT NOT NULL DEFAULT ('SEG' || lpad((nextval('insurance_companies_seq'))::text, 5, '0')) PRIMARY KEY,
    nome TEXT NOT NULL,
    codigo_mediador TEXT,
    logotipo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insurance Products
CREATE TABLE IF NOT EXISTS public.insurance_products (
    numero_produto TEXT NOT NULL DEFAULT ('PROD' || lpad((nextval('insurance_products_seq'))::text, 5, '0')) PRIMARY KEY,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Angariadores
CREATE TABLE IF NOT EXISTS public.angariadores (
    numero_angariador TEXT NOT NULL DEFAULT ('ANG' || lpad((nextval('angariadores_seq'))::text, 5, '0')) PRIMARY KEY,
    nome TEXT NOT NULL,
    morada TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subangariadores
CREATE TABLE IF NOT EXISTS public.subangariadores (
    subanga_codigo TEXT NOT NULL DEFAULT ('SUB' || lpad((nextval('subangariadores_seq'))::text, 5, '0')) PRIMARY KEY,
    subanga_nome TEXT NOT NULL,
    subanga_morada TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    phone2 TEXT,
    address TEXT,
    postal_code TEXT,
    nif TEXT,
    notes TEXT,
    birth_date DATE,
    title_code TEXT,
    profession_code TEXT,
    internet TEXT,
    spouse_internet TEXT,
    spouse_nif TEXT,
    nib TEXT,
    niss TEXT,
    social_security_code TEXT,
    mobile_key TEXT,
    viewed BOOLEAN DEFAULT false,
    new_customer_viewed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Family Members
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    customer_ref_id UUID,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Historial
CREATE TABLE IF NOT EXISTS public.historial (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    historial_number TEXT NOT NULL,
    occurrence TEXT NOT NULL,
    occurrence_date DATE DEFAULT CURRENT_DATE,
    nif TEXT,
    response TEXT,
    urgent BOOLEAN DEFAULT false,
    viewed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    customer_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Receipts
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    receipt_number TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'paid',
    type TEXT DEFAULT 'contabilidade',
    sub_type TEXT,
    notes TEXT,
    nfc TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    paid_date DATE,
    viewed BOOLEAN DEFAULT false,
    last_modified_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insurance
CREATE TABLE IF NOT EXISTS public.insurance (
    numero UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    customer_id UUID,
    nif TEXT,
    numero_apolice TEXT,
    numero_produto TEXT,
    numero_angariador TEXT,
    subanga_codigo TEXT,
    codigo_marca TEXT,
    codigo_estado TEXT,
    codigo_pagamento TEXT,
    codigo_mediador TEXT,
    insurance_company_codigo TEXT,
    matricula TEXT,
    numero_mes INTEGER,
    data_vencimento DATE,
    data_emissao_seg DATE,
    data_cancelamento DATE,
    seguro_novo_apresent BOOLEAN DEFAULT false,
    visto BOOLEAN DEFAULT false,
    data_ultima_alteracao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insurance Receipts
CREATE TABLE IF NOT EXISTS public.insurance_receipts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    customer_id UUID,
    numero_recibo_seg TEXT NOT NULL,
    apolice_numero TEXT,
    numero_recibo_companhia TEXT,
    premio_total NUMERIC,
    recebido_maiato BOOLEAN DEFAULT false,
    pago_companhia BOOLEAN DEFAULT false,
    anulado BOOLEAN DEFAULT false,
    estorno BOOLEAN DEFAULT false,
    visto BOOLEAN DEFAULT false,
    data_pagamento DATE,
    data_entrega DATE,
    data_ultima_alteracao_seg TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 4. INSERIR DADOS DE REFERÊNCIA
-- =====================================================

-- Titles
INSERT INTO public.titles (id, name) VALUES
(1, 'Sr.ª'),
(2, 'Dra.'),
(3, 'Dr.'),
(4, 'Eng.'),
(5, 'Arq.'),
(6, 'Sr.'),
(7, 'Prof.'),
(8, 'Enf.'),
(9, 'Méd.'),
(10, 'Adv.'),
(11, 'Outro')
ON CONFLICT (id) DO NOTHING;

-- Professions
INSERT INTO public.professions (id, name) VALUES
(1, 'Advogado(a)'),
(2, 'Enfermeiro(a)'),
(3, 'Professor(a)'),
(4, 'Engenheiro(a)'),
(5, 'Médico(a)'),
(6, 'Arquiteto(a)'),
(7, 'Empresário(a)'),
(8, 'Funcionário(a) Público'),
(9, 'Comerciante'),
(10, 'Outro')
ON CONFLICT (id) DO NOTHING;

-- Insurance Months
INSERT INTO public.insurance_months (numero, mes) VALUES
(1, 'Janeiro'),
(2, 'Fevereiro'),
(3, 'Março'),
(4, 'Abril'),
(5, 'Maio'),
(6, 'Junho'),
(7, 'Julho'),
(8, 'Agosto'),
(9, 'Setembro'),
(10, 'Outubro'),
(11, 'Novembro'),
(12, 'Dezembro')
ON CONFLICT (numero) DO NOTHING;

-- Insurance States
INSERT INTO public.insurance_states (codigo_estado, estado) VALUES
('ATIVO', 'Ativo'),
('CANCELADO', 'Cancelado'),
('SUSPENSO', 'Suspenso'),
('RENOVADO', 'Renovado')
ON CONFLICT (codigo_estado) DO NOTHING;

-- Payment Types
INSERT INTO public.payment_types (codigo_pagamento, tipo_pagamento) VALUES
('MENSAL', 'Mensal'),
('TRIMESTRAL', 'Trimestral'),
('SEMESTRAL', 'Semestral'),
('ANUAL', 'Anual')
ON CONFLICT (codigo_pagamento) DO NOTHING;

-- Service Types
INSERT INTO public.service_types (id, code, name) VALUES
('a869b5aa-988a-4edd-9691-394ad12527c1', 'IRS', 'IRS e derivados'),
('28c59e66-0d5a-47e7-aa3a-40a7ccb28afe', 'EMPRESAS_TI', 'Empresas e TI'),
('fb08cfd0-1c44-4a6a-8bae-e1b8e08a431a', 'CONSULTORIA', 'Consultoria'),
('cb6611fe-87be-45c4-b23f-f0796ccd7741', 'DIVERSOS', 'Diversos'),
('4f7d1a9e-c8b3-4f0e-9d2a-7e6b5c3d2f10', 'PAGAMENTOS', 'Pagamentos')
ON CONFLICT (id) DO NOTHING;

-- Insurance Mediators
INSERT INTO public.insurance_mediators (bi, nome) VALUES
('MED00001', 'mediador1')
ON CONFLICT (bi) DO NOTHING;

-- Insurance Companies
INSERT INTO public.insurance_companies (codigo, nome, codigo_mediador, logotipo) VALUES
('SEG00001', 'Lusitânia', 'MED00001', 'https://www.lusitania.pt/media/2tdp1031/logotipo-lusitania-meta.png'),
('SEG00002', 'OK', 'MED00001', NULL)
ON CONFLICT (codigo) DO NOTHING;

-- Insurance Products
INSERT INTO public.insurance_products (numero_produto, nome) VALUES
('PROD00001', 'teste')
ON CONFLICT (numero_produto) DO NOTHING;

-- Angariadores
INSERT INTO public.angariadores (numero_angariador, nome, morada) VALUES
('ANG00001', 'angariador 1 ', 'morada angariador 1')
ON CONFLICT (numero_angariador) DO NOTHING;

-- Subangariadores
INSERT INTO public.subangariadores (subanga_codigo, subanga_nome, subanga_morada) VALUES
('SUB00001', 'sub-ang', 'teste')
ON CONFLICT (subanga_codigo) DO NOTHING;

-- =====================================================
-- 5. CRIAR FUNÇÃO has_role
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =====================================================
-- 6. CRIAR FUNÇÃO handle_new_user
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- =====================================================
-- 7. CRIAR FUNÇÃO update_updated_at_column
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 8. ATIVAR RLS EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_mediators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angariadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subangariadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_receipts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CRIAR POLÍTICAS RLS
-- =====================================================

-- Titles (apenas leitura)
CREATE POLICY "Authenticated users can view titles" ON public.titles FOR SELECT USING (true);

-- Professions (apenas leitura)
CREATE POLICY "Authenticated users can view professions" ON public.professions FOR SELECT USING (true);

-- Insurance Months (apenas leitura)
CREATE POLICY "Authenticated users can view months" ON public.insurance_months FOR SELECT USING (true);

-- Insurance States
CREATE POLICY "Authenticated users can view states" ON public.insurance_states FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create states" ON public.insurance_states FOR INSERT WITH CHECK (true);

-- Payment Types
CREATE POLICY "Authenticated users can view payment types" ON public.payment_types FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create payment types" ON public.payment_types FOR INSERT WITH CHECK (true);

-- Service Types
CREATE POLICY "Authenticated users can view service types" ON public.service_types FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create service types" ON public.service_types FOR INSERT WITH CHECK (true);

-- Vehicle Brands
CREATE POLICY "Authenticated users can view brands" ON public.vehicle_brands FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create brands" ON public.vehicle_brands FOR INSERT WITH CHECK (true);

-- Insurance Mediators
CREATE POLICY "Authenticated users can view mediators" ON public.insurance_mediators FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create mediators" ON public.insurance_mediators FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update insurance mediators" ON public.insurance_mediators FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete insurance mediators" ON public.insurance_mediators FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Insurance Companies
CREATE POLICY "Authenticated users can view companies" ON public.insurance_companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create companies" ON public.insurance_companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update insurance companies" ON public.insurance_companies FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete insurance companies" ON public.insurance_companies FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Insurance Products
CREATE POLICY "Authenticated users can view products" ON public.insurance_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create products" ON public.insurance_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update insurance products" ON public.insurance_products FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete insurance products" ON public.insurance_products FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Angariadores
CREATE POLICY "Authenticated users can view angariadores" ON public.angariadores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create angariadores" ON public.angariadores FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update angariadores" ON public.angariadores FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete angariadores" ON public.angariadores FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Subangariadores
CREATE POLICY "Authenticated users can view subangariadores" ON public.subangariadores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create subangariadores" ON public.subangariadores FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update subangariadores" ON public.subangariadores FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete subangariadores" ON public.subangariadores FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- User Roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Customers
CREATE POLICY "Employees and admins can view customers" ON public.customers FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can create customers" ON public.customers FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can update customers" ON public.customers FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Only admins can delete customers" ON public.customers FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Family Members
CREATE POLICY "Users can manage family members of their customers" ON public.family_members FOR ALL 
USING ((EXISTS ( SELECT 1 FROM customers WHERE customers.id = family_members.customer_id AND customers.user_id = auth.uid())) OR (EXISTS ( SELECT 1 FROM customers WHERE customers.id = family_members.customer_ref_id AND customers.user_id = auth.uid())))
WITH CHECK ((EXISTS ( SELECT 1 FROM customers WHERE customers.id = family_members.customer_id AND customers.user_id = auth.uid())) OR (EXISTS ( SELECT 1 FROM customers WHERE customers.id = family_members.customer_ref_id AND customers.user_id = auth.uid())));

-- Historial
CREATE POLICY "Only admins can view historial" ON public.historial FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can create historial" ON public.historial FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update historial" ON public.historial FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete historial" ON public.historial FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Reminders
CREATE POLICY "Employees and admins can view reminders" ON public.reminders FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can create reminders" ON public.reminders FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can update reminders" ON public.reminders FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Only admins can delete reminders" ON public.reminders FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Receipts
CREATE POLICY "Employees and admins can view receipts" ON public.receipts FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can create receipts" ON public.receipts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can update receipts" ON public.receipts FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Only admins can delete receipts" ON public.receipts FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Insurance
CREATE POLICY "Employees and admins can view insurance" ON public.insurance FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can create insurance" ON public.insurance FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can update insurance" ON public.insurance FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Only admins can delete insurance" ON public.insurance FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Insurance Receipts
CREATE POLICY "Employees and admins can view insurance receipts" ON public.insurance_receipts FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can create insurance receipts" ON public.insurance_receipts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees and admins can update insurance receipts" ON public.insurance_receipts FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Only admins can delete insurance receipts" ON public.insurance_receipts FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- 10. CRIAR TRIGGER PARA NOVOS UTILIZADORES
-- =====================================================
-- NOTA: Este trigger precisa de ser criado manualmente no dashboard
-- porque requer acesso ao schema auth
-- 
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FIM DA EXPORTAÇÃO
-- =====================================================
