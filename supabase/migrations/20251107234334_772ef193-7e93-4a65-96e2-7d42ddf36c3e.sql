-- Create historial table
CREATE TABLE public.historial (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  historial_number text NOT NULL,
  occurrence text NOT NULL,
  nif text,
  occurrence_date date NOT NULL DEFAULT CURRENT_DATE,
  response text,
  urgent boolean NOT NULL DEFAULT false,
  viewed boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.historial ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view all historial"
  ON public.historial
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create historial"
  ON public.historial
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update historial"
  ON public.historial
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete historial"
  ON public.historial
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_historial_updated_at
  BEFORE UPDATE ON public.historial
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_historial_customer_id ON public.historial(customer_id);
CREATE INDEX idx_historial_urgent ON public.historial(urgent) WHERE urgent = true AND response IS NULL;