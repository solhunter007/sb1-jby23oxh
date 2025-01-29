-- Create a function to handle user-initiated account deletion
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the ID of the authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete user's sermon notes
    DELETE FROM sermon_notes WHERE user_id = v_user_id;
    
    -- Delete user's follows
    DELETE FROM follows WHERE follower_id = v_user_id OR following_id = v_user_id;
    
    -- Delete user's notifications
    DELETE FROM notifications WHERE user_id = v_user_id;
    
    -- Delete user's profile
    DELETE FROM profiles WHERE id = v_user_id;
    
    -- Delete the user from auth.users
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;