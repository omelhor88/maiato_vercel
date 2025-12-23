-- Remove user_id dependency from tables to make it a single company system
-- Update RLS policies to allow authenticated users to access all data

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

DROP POLICY IF EXISTS "Users can view their own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can create their own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update their own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON receipts;

DROP POLICY IF EXISTS "Users can manage their insurance" ON insurance;
DROP POLICY IF EXISTS "Users can manage their own reminders" ON reminders;

-- Create new company-wide policies (all authenticated users can access all data)
CREATE POLICY "Authenticated users can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Receipts policies
CREATE POLICY "Authenticated users can view all receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update receipts"
  ON receipts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete receipts"
  ON receipts FOR DELETE
  TO authenticated
  USING (true);

-- Insurance policies
CREATE POLICY "Authenticated users can view all insurance"
  ON insurance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create insurance"
  ON insurance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update insurance"
  ON insurance FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete insurance"
  ON insurance FOR DELETE
  TO authenticated
  USING (true);

-- Reminders policies
CREATE POLICY "Authenticated users can view all reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (true);