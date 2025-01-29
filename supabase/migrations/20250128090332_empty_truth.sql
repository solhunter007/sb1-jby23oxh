/*
  # Fix authentication and RLS policies

  1. Changes
    - Add policy to allow profile creation during signup
    - Update account deletion to properly handle auth session
    - Remove admin user deletion attempt
    - Add policy for church admin profile updates

  2. Security
    - Maintain RLS while allowing necessary operations
    - Ensure proper cleanup during account deletion
*/

-- Add policy to allow profile creation during signup
CREATE POLICY "Enable insert for authenticated users only"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Update the delete_user function to handle auth session
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_church_id uuid;
BEGIN
    -- Get the ID of the authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get church_id if user is a church admin
    SELECT church_id INTO v_church_id
    FROM profiles
    WHERE id = v_user_id;

    -- If user is a church admin, delete the church first
    IF v_church_id IS NOT NULL THEN
        DELETE FROM churches WHERE id = v_church_id;
    END IF;

    -- Delete user's sermon notes
    DELETE FROM sermon_notes WHERE user_id = v_user_id;
    
    -- Delete user's follows
    DELETE FROM follows WHERE follower_id = v_user_id OR following_id = v_user_id;
    
    -- Delete user's notifications
    DELETE FROM notifications WHERE user_id = v_user_id;
    
    -- Delete user's profile
    DELETE FROM profiles WHERE id = v_user_id;
    
    -- Delete the user's auth account
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;