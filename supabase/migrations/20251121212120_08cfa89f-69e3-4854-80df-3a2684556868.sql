-- 1. Remover coluna 'bi' da tabela insurance (usamos codigo_mediador para mediadores)
ALTER TABLE public.insurance DROP COLUMN IF EXISTS bi;

-- 2. Remover coluna 'numero' da tabela insurance 
-- (vamos usar 'numero' como primary key que já existe - UUID)
-- Não é necessário fazer nada aqui pois já temos 'numero' como UUID primary key

-- 3. Apagar tabela insured_persons (não é usada)
DROP TABLE IF EXISTS public.insured_persons CASCADE;

-- 4. Limpar dados atuais de payment_types e adicionar tipos corretos
DELETE FROM public.payment_types;

-- Inserir tipos de pagamento corretos (frequência de pagamento)
INSERT INTO public.payment_types (codigo_pagamento, tipo_pagamento) VALUES
  ('MENSAL', 'Mensal'),
  ('TRIMESTRAL', 'Trimestral'),
  ('SEMESTRAL', 'Semestral'),
  ('ANUAL', 'Anual');

-- 5. Apagar tabela receipt_services (não é usada)
DROP TABLE IF EXISTS public.receipt_services CASCADE;