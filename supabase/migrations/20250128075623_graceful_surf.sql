/*
  # Add trending tags function and storage bucket

  1. New Functions
    - `get_trending_tags`: Returns the most used tags in sermon notes
      - Counts tag usage in the last 7 days
      - Orders by usage count descending
      - Returns tag details and usage count
  
  2. Storage
    - Create avatars bucket for profile pictures
    - Enable public access to avatars through RLS policies
*/

-- Create function to get trending tags
CREATE OR REPLACE FUNCTION public.get_trending_tags()
RETURNS TABLE (
  id uuid,
  name text,
  created_at timestamptz,
  _count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.created_at,
    COUNT(st.tag_id)::bigint as _count
  FROM tags t
  LEFT JOIN sermon_tags st ON t.id = st.tag_id
  LEFT JOIN sermon_notes sn ON st.sermon_id = sn.id
  WHERE sn.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY t.id, t.name, t.created_at
  ORDER BY _count DESC;
END;
$$;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access to avatars
CREATE POLICY "Give public access to avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Create a policy to allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );