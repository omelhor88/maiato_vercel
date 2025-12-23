-- Create sequences for automatic code generation
CREATE SEQUENCE IF NOT EXISTS insurance_companies_seq START 1;
CREATE SEQUENCE IF NOT EXISTS insurance_products_seq START 1;
CREATE SEQUENCE IF NOT EXISTS insurance_mediators_seq START 1;
CREATE SEQUENCE IF NOT EXISTS angariadores_seq START 1;
CREATE SEQUENCE IF NOT EXISTS subangariadores_seq START 1;

-- Drop existing tables and recreate with auto-generated codes
DROP TABLE IF EXISTS insurance_companies CASCADE;
DROP TABLE IF EXISTS insurance_products CASCADE;
DROP TABLE IF EXISTS insurance_mediators CASCADE;
DROP TABLE IF EXISTS angariadores CASCADE;
DROP TABLE IF EXISTS subangariadores CASCADE;

-- Insurance Mediators (must be created first as it's referenced by insurance_companies)
CREATE TABLE insurance_mediators (
  bi text PRIMARY KEY DEFAULT 'MED' || LPAD(nextval('insurance_mediators_seq')::text, 5, '0'),
  nome text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Insurance Companies
CREATE TABLE insurance_companies (
  codigo text PRIMARY KEY DEFAULT 'SEG' || LPAD(nextval('insurance_companies_seq')::text, 5, '0'),
  nome text NOT NULL,
  codigo_mediador text REFERENCES insurance_mediators(bi) ON DELETE SET NULL,
  logotipo text,
  created_at timestamp with time zone DEFAULT now()
);

-- Insurance Products
CREATE TABLE insurance_products (
  numero_produto text PRIMARY KEY DEFAULT 'PROD' || LPAD(nextval('insurance_products_seq')::text, 5, '0'),
  nome text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Angariadores
CREATE TABLE angariadores (
  numero_angariador text PRIMARY KEY DEFAULT 'ANG' || LPAD(nextval('angariadores_seq')::text, 5, '0'),
  nome text NOT NULL,
  morada text,
  created_at timestamp with time zone DEFAULT now()
);

-- Subangariadores
CREATE TABLE subangariadores (
  subanga_codigo text PRIMARY KEY DEFAULT 'SUB' || LPAD(nextval('subangariadores_seq')::text, 5, '0'),
  subanga_nome text NOT NULL,
  subanga_morada text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE insurance_mediators ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE angariadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE subangariadores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insurance_mediators
CREATE POLICY "Authenticated users can view mediators" ON insurance_mediators FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create mediators" ON insurance_mediators FOR INSERT WITH CHECK (true);

-- RLS Policies for insurance_companies
CREATE POLICY "Authenticated users can view companies" ON insurance_companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create companies" ON insurance_companies FOR INSERT WITH CHECK (true);

-- RLS Policies for insurance_products
CREATE POLICY "Authenticated users can view products" ON insurance_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create products" ON insurance_products FOR INSERT WITH CHECK (true);

-- RLS Policies for angariadores
CREATE POLICY "Authenticated users can view angariadores" ON angariadores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create angariadores" ON angariadores FOR INSERT WITH CHECK (true);

-- RLS Policies for subangariadores
CREATE POLICY "Authenticated users can view subangariadores" ON subangariadores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create subangariadores" ON subangariadores FOR INSERT WITH CHECK (true);