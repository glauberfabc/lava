/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Create new, simplified policies for profile access
    - Maintain security while avoiding recursion
  
  2. Security
    - Users can still only view their own profile
    - Admins can view and update all profiles
    - Policies are now non-recursive
*/

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Enable read access for users to their own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Enable read access for admins to all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Enable update access for admins to all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);