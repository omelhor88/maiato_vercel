-- First, let's verify we have proper role checking function (already exists but confirming)
-- The has_role function already exists from the project context

-- Update RLS policies for customers table to allow employees access
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

CREATE POLICY "Employees and admins can view customers"
ON public.customers FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can create customers"
ON public.customers FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can update customers"
ON public.customers FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Only admins can delete customers"
ON public.customers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for insurance table
DROP POLICY IF EXISTS "Authenticated users can view all insurance" ON public.insurance;
DROP POLICY IF EXISTS "Authenticated users can create insurance" ON public.insurance;
DROP POLICY IF EXISTS "Authenticated users can update insurance" ON public.insurance;
DROP POLICY IF EXISTS "Authenticated users can delete insurance" ON public.insurance;

CREATE POLICY "Employees and admins can view insurance"
ON public.insurance FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can create insurance"
ON public.insurance FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can update insurance"
ON public.insurance FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Only admins can delete insurance"
ON public.insurance FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for receipts table
DROP POLICY IF EXISTS "Authenticated users can view all receipts" ON public.receipts;
DROP POLICY IF EXISTS "Authenticated users can create receipts" ON public.receipts;
DROP POLICY IF EXISTS "Authenticated users can update receipts" ON public.receipts;
DROP POLICY IF EXISTS "Authenticated users can delete receipts" ON public.receipts;

CREATE POLICY "Employees and admins can view receipts"
ON public.receipts FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can create receipts"
ON public.receipts FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can update receipts"
ON public.receipts FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Only admins can delete receipts"
ON public.receipts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for receipt_services table
DROP POLICY IF EXISTS "Authenticated users can view all receipt services" ON public.receipt_services;
DROP POLICY IF EXISTS "Authenticated users can create receipt services" ON public.receipt_services;
DROP POLICY IF EXISTS "Authenticated users can update receipt services" ON public.receipt_services;
DROP POLICY IF EXISTS "Authenticated users can delete receipt services" ON public.receipt_services;

CREATE POLICY "Employees and admins can view receipt services"
ON public.receipt_services FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can create receipt services"
ON public.receipt_services FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can update receipt services"
ON public.receipt_services FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Only admins can delete receipt services"
ON public.receipt_services FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for historial table (only admins should access this)
DROP POLICY IF EXISTS "Authenticated users can view all historial" ON public.historial;
DROP POLICY IF EXISTS "Authenticated users can create historial" ON public.historial;
DROP POLICY IF EXISTS "Authenticated users can update historial" ON public.historial;
DROP POLICY IF EXISTS "Authenticated users can delete historial" ON public.historial;

CREATE POLICY "Only admins can view historial"
ON public.historial FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create historial"
ON public.historial FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update historial"
ON public.historial FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete historial"
ON public.historial FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for reminders table
DROP POLICY IF EXISTS "Authenticated users can view all reminders" ON public.reminders;
DROP POLICY IF EXISTS "Authenticated users can create reminders" ON public.reminders;
DROP POLICY IF EXISTS "Authenticated users can update reminders" ON public.reminders;
DROP POLICY IF EXISTS "Authenticated users can delete reminders" ON public.reminders;

CREATE POLICY "Employees and admins can view reminders"
ON public.reminders FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can create reminders"
ON public.reminders FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Employees and admins can update reminders"
ON public.reminders FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'employee'::app_role)
);

CREATE POLICY "Only admins can delete reminders"
ON public.reminders FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));