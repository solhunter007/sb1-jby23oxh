/*
  # Update Church Table Policies

  1. Security Changes
    - Add RLS policies for the churches table to allow:
      - Authenticated users to create churches
      - Church admins to update their own churches
      - Church admins to delete their own churches
    
  Note: The "Churches are viewable by everyone" policy already exists
*/

DO $$ 
BEGIN
  -- Policy to allow authenticated users to create churches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'churches' 
    AND policyname = 'Authenticated users can create churches'
  ) THEN
    CREATE POLICY "Authenticated users can create churches"
    ON public.churches
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- Policy to allow church admins to update their churches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'churches' 
    AND policyname = 'Church admins can update their churches'
  ) THEN
    CREATE POLICY "Church admins can update their churches"
    ON public.churches
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.church_id = id
          AND profiles.id = auth.uid()
      )
    );
  END IF;

  -- Policy to allow church admins to delete their churches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'churches' 
    AND policyname = 'Church admins can delete their churches'
  ) THEN
    CREATE POLICY "Church admins can delete their churches"
    ON public.churches
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.church_id = id
          AND profiles.id = auth.uid()
      )
    );
  END IF;
END $$;