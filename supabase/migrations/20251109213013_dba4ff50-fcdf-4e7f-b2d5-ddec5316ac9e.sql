-- Add sub_type and paid_date columns to receipts table
ALTER TABLE public.receipts 
ADD COLUMN sub_type text,
ADD COLUMN paid_date date;

-- Add comments to clarify the fields
COMMENT ON COLUMN public.receipts.sub_type IS 'Sub-category for contabilidade receipts: IRS e derivados, Empresas e TI, Consultoria, Diversos, or custom';
COMMENT ON COLUMN public.receipts.description IS 'Custom service description for the receipt';
COMMENT ON COLUMN public.receipts.paid_date IS 'Date when the receipt was actually paid (can differ from issue_date)';