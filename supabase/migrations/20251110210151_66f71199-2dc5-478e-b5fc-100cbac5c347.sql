-- Drop all foreign key constraints first
ALTER TABLE insurance DROP CONSTRAINT IF EXISTS insurance_insurance_company_id_fkey;
ALTER TABLE insurance DROP CONSTRAINT IF EXISTS insurance_codigo_mediador_fkey;

-- Rename old tables to backup
ALTER TABLE insurance_companies RENAME TO insurance_companies_old;
ALTER TABLE insurance_mediators RENAME TO insurance_mediators_old;

-- Create new insurance_companies table with correct structure
CREATE TABLE insurance_companies (
  codigo text PRIMARY KEY,
  nome text NOT NULL,
  codigo_mediador text,
  logotipo text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create new insurance_mediators table with correct structure  
CREATE TABLE insurance_mediators (
  bi text PRIMARY KEY,
  nome text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_mediators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for insurance_companies
CREATE POLICY "Authenticated users can view companies"
ON insurance_companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create companies"
ON insurance_companies FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create RLS policies for insurance_mediators
CREATE POLICY "Authenticated users can view mediators"
ON insurance_mediators FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create mediators"
ON insurance_mediators FOR INSERT
TO authenticated
WITH CHECK (true);

-- Migrate data from old insurance_companies to new insurance_mediators (swap)
INSERT INTO insurance_mediators (bi, nome, created_at)
SELECT 
  id::text as bi,
  name as nome,
  created_at
FROM insurance_companies_old
ON CONFLICT (bi) DO NOTHING;

-- Migrate data from old insurance_mediators to new insurance_companies (swap)
INSERT INTO insurance_companies (codigo, nome, codigo_mediador, logotipo, created_at)
SELECT 
  codigo,
  nome,
  codigo_mediador,
  logotipo,
  created_at
FROM insurance_mediators_old
ON CONFLICT (codigo) DO NOTHING;

-- Update insurance table to use text instead of uuid for insurance_company_id
ALTER TABLE insurance DROP COLUMN IF EXISTS insurance_company_id;
ALTER TABLE insurance ADD COLUMN insurance_company_codigo text REFERENCES insurance_companies(codigo);

-- Drop old tables with CASCADE
DROP TABLE insurance_companies_old CASCADE;
DROP TABLE insurance_mediators_old CASCADE;