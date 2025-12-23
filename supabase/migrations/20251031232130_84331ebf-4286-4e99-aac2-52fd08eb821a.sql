-- Create insurance companies table
CREATE TABLE public.insurance_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;

-- Create policies for insurance_companies
CREATE POLICY "Authenticated users can view all companies"
ON public.insurance_companies
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create companies"
ON public.insurance_companies
FOR INSERT
WITH CHECK (true);

-- Insert some common insurance companies
INSERT INTO public.insurance_companies (name) VALUES
  ('Allianz'),
  ('Generali'),
  ('Ageas'),
  ('Fidelidade'),
  ('Liberty'),
  ('Tranquilidade'),
  ('Mapfre'),
  ('AXA'),
  ('Zurich'),
  ('AdvanceCare')
ON CONFLICT (name) DO NOTHING;