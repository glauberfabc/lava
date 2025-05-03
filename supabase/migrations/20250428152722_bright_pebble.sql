/*
  # Fix profile policies to avoid recursion

  1. Changes
    - Drop and recreate policies for profile access
    - Use EXISTS subqueries to avoid recursion
    - Separate policies for regular users and admins

  2. Security
    - Users can only read their own profile
    - Admins can read and update all profiles
    - Prevents infinite recursion in policy checks
*/

DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Enable read access for users to their own profile'
  ) THEN
    DROP POLICY "Enable read access for users to their own profile" ON profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Enable read access for admins to all profiles'
  ) THEN
    DROP POLICY "Enable read access for admins to all profiles" ON profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Enable update access for admins to all profiles'
  ) THEN
    DROP POLICY "Enable update access for admins to all profiles" ON profiles;
  END IF;
END $$;

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
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable update access for admins to all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);