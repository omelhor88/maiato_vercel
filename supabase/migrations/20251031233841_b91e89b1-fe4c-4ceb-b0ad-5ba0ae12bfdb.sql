-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage family members of their customers" ON public.family_members;

-- Create new policy that checks both customer_id and customer_ref_id
CREATE POLICY "Users can manage family members of their customers"
ON public.family_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE (customers.id = family_members.customer_id AND customers.user_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM customers 
    WHERE (customers.id = family_members.customer_ref_id AND customers.user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE (customers.id = family_members.customer_id AND customers.user_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM customers 
    WHERE (customers.id = family_members.customer_ref_id AND customers.user_id = auth.uid())
  )
);