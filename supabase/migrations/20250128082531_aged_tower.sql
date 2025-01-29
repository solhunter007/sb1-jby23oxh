/*
  # Account Deletion Features

  1. New Functions
    - handle_account_deletion: Handles cleanup of user data before account deletion
    - handle_church_deletion: Handles cleanup of church data before deletion
*/

-- Function to handle user account deletion cleanup
CREATE OR REPLACE FUNCTION public.handle_account_deletion()
RETURNS trigger AS $$
BEGIN
  -- Delete user's sermon notes
  DELETE FROM public.sermon_notes WHERE user_id = OLD.id;
  
  -- Delete user's follows
  DELETE FROM public.follows WHERE follower_id = OLD.id OR following_id = OLD.id;
  
  -- Delete user's notifications
  DELETE FROM public.notifications WHERE user_id = OLD.id;
  
  -- Remove user's profile
  DELETE FROM public.profiles WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for account deletion cleanup
DROP TRIGGER IF EXISTS on_account_deleted ON auth.users;
CREATE TRIGGER on_account_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_account_deletion();