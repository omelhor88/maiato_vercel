-- Add issue_date column to insurance table
ALTER TABLE public.insurance
ADD COLUMN issue_date DATE NOT NULL DEFAULT CURRENT_DATE;