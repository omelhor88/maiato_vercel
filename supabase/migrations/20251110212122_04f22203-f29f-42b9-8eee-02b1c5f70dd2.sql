-- Add UPDATE and DELETE policies for reference data tables

-- Insurance Companies
CREATE POLICY "Admins can update insurance companies"
ON insurance_companies FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete insurance companies"
ON insurance_companies FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insurance Mediators
CREATE POLICY "Admins can update insurance mediators"
ON insurance_mediators FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete insurance mediators"
ON insurance_mediators FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Angariadores
CREATE POLICY "Admins can update angariadores"
ON angariadores FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete angariadores"
ON angariadores FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Subangariadores
CREATE POLICY "Admins can update subangariadores"
ON subangariadores FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subangariadores"
ON subangariadores FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insurance Products
CREATE POLICY "Admins can update insurance products"
ON insurance_products FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete insurance products"
ON insurance_products FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));