/*
  # Create vehicles table

  1. New Tables
    - `vehicles`
      - `id` (uuid, primary key)
      - `license_plate` (text)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `timestamp` (timestamptz)
      - `status` (text)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `vehicles` table
    - Add policies for authenticated users to manage their own vehicles
*/

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('waiting', 'in-progress', 'completed')),
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);