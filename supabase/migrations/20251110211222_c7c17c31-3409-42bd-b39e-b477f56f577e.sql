-- Update insurance table to use the new foreign key structure
ALTER TABLE insurance DROP CONSTRAINT IF EXISTS insurance_insurance_company_codigo_fkey;
ALTER TABLE insurance DROP COLUMN IF EXISTS insurance_company_codigo;
ALTER TABLE insurance ADD COLUMN insurance_company_codigo text REFERENCES insurance_companies(codigo) ON DELETE SET NULL;