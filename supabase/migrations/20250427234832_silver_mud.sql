/*
  # Add services management

  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price` (numeric)
      - `category` (text)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `services` table
    - Add policies for authenticated users to manage their services
*/

CREATE TYPE vehicle_category AS ENUM (
  'carro_pequeno',
  'carro_medio',
  'carro_grande',
  'suv',
  'van',
  'caminhonete',
  'moto'
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  category vehicle_category NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add service_id to vehicles table
ALTER TABLE vehicles ADD COLUMN service_id uuid REFERENCES services(id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own services"
  ON services
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON services
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);