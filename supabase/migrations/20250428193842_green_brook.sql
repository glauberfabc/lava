/*
  # Add support for multiple services per vehicle

  1. Changes
    - Create vehicle_services junction table for many-to-many relationship
    - Drop existing service_id column from vehicles table
    - Add RLS policies for the new table

  2. Security
    - Enable RLS on vehicle_services table
    - Add policies for authenticated users to manage their vehicle services
*/

-- Create junction table for vehicles and services
CREATE TABLE IF NOT EXISTS vehicle_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vehicle_id, service_id)
);

-- Drop the old service_id column from vehicles
ALTER TABLE vehicles DROP COLUMN IF EXISTS service_id;

-- Enable RLS on the junction table
ALTER TABLE vehicle_services ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for the junction table
CREATE POLICY "Users can view their own vehicle services"
  ON vehicle_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_services.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own vehicle services"
  ON vehicle_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_services.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own vehicle services"
  ON vehicle_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_services.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );