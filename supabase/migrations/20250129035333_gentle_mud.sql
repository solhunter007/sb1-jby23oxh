/*
  # Add username login support
  
  1. Changes
    - Add function to get user email by username
    - Add policy to allow reading user emails for authentication
*/

-- Function to get user email by username
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(username_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT au.email INTO user_email
  FROM auth.users au
  JOIN public.profiles p ON au.id = p.id
  WHERE LOWER(p.username) = LOWER(username_input);
  
  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_user_email_by_username TO authenticated, anon;