-- Alterar campo estorno de numeric para boolean na tabela insurance_receipts
ALTER TABLE insurance_receipts 
DROP COLUMN estorno;

ALTER TABLE insurance_receipts 
ADD COLUMN estorno boolean DEFAULT false;