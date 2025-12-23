-- Create company_commissions table
CREATE TABLE public.company_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.insurance_companies(id) ON DELETE CASCADE,
  commission_percentage NUMERIC NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_commissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view commissions"
ON public.company_commissions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create commissions"
ON public.company_commissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update commissions"
ON public.company_commissions
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete commissions"
ON public.company_commissions
FOR DELETE
USING (true);

-- Create update trigger
CREATE TRIGGER update_company_commissions_updated_at
BEFORE UPDATE ON public.company_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();