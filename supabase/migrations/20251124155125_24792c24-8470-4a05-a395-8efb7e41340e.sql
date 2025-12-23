-- Add data_pagamento column to insurance_receipts table
ALTER TABLE insurance_receipts 
ADD COLUMN IF NOT EXISTS data_pagamento date;