-- Drop existing insurance_receipts table and recreate with correct structure
DROP TABLE IF EXISTS public.insurance_receipts CASCADE;

-- Create insurance_receipts table linked to insurance
CREATE TABLE public.insurance_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_id uuid,
  numero_recibo_seg text NOT NULL,
  apolice_numero text,
  recebido_maiato boolean DEFAULT false,
  pago_companhia boolean DEFAULT false,
  premio_total numeric,
  estorno numeric,
  numero_recibo_companhia text,
  anulado boolean DEFAULT false,
  data_pagamento date,
  data_ultima_alteracao_seg timestamp with time zone DEFAULT now(),
  data_entrega date,
  visto boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.insurance_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees and admins can view insurance receipts"
  ON public.insurance_receipts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees and admins can create insurance receipts"
  ON public.insurance_receipts
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees and admins can update insurance receipts"
  ON public.insurance_receipts
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Only admins can delete insurance receipts"
  ON public.insurance_receipts
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_insurance_receipts_updated_at
  BEFORE UPDATE ON public.insurance_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_insurance_receipts_customer_id ON public.insurance_receipts(customer_id);
CREATE INDEX idx_insurance_receipts_apolice_numero ON public.insurance_receipts(apolice_numero);
CREATE INDEX idx_insurance_receipts_user_id ON public.insurance_receipts(user_id);