-- Create insurance_receipts table
CREATE TABLE public.insurance_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  customer_id uuid,
  numero_recibo_seg text NOT NULL,
  data_venc_recibo date,
  recebido_maiato boolean DEFAULT false,
  pago_companhia boolean DEFAULT false,
  premio_total numeric(10, 2),
  premio_comercial numeric(10, 2),
  comissao numeric(10, 2),
  irs numeric(10, 2),
  imposto_selo numeric(10, 2),
  data_emissao_rec date,
  apolice_numero text,
  estorno boolean DEFAULT false,
  aviso_recibo_atraso boolean DEFAULT false,
  numero_recibo_companhia text,
  anulado boolean DEFAULT false,
  aviso_recibo boolean DEFAULT false,
  data_pagamento date,
  data_resolucao date,
  data_ultima_alteracao_seg timestamp with time zone DEFAULT now(),
  data_entrega date,
  visto boolean DEFAULT false,
  anulado_companhia boolean DEFAULT false,
  cobrado_nao_recebido boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.insurance_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for insurance_receipts
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

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_insurance_receipts_updated_at
BEFORE UPDATE ON public.insurance_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_insurance_receipts_customer_id ON public.insurance_receipts(customer_id);
CREATE INDEX idx_insurance_receipts_apolice_numero ON public.insurance_receipts(apolice_numero);
CREATE INDEX idx_insurance_receipts_user_id ON public.insurance_receipts(user_id);