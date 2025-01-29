/*
  # Initial Schema for Sermon Buddy

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - username (text, unique)
      - full_name (text)
      - bio (text)
      - avatar_url (text)
      - church_id (uuid, references churches)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - churches
      - id (uuid)
      - name (text)
      - description (text)
      - image_url (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - sermon_notes
      - id (uuid)
      - user_id (uuid, references profiles)
      - title (text)
      - content (text)
      - privacy (text)
      - church_id (uuid, references churches)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - follows
      - follower_id (uuid, references profiles)
      - following_id (uuid, references profiles)
      - created_at (timestamp)
    
    - tags
      - id (uuid)
      - name (text)
      - created_at (timestamp)
    
    - sermon_tags
      - sermon_id (uuid, references sermon_notes)
      - tag_id (uuid, references tags)
      - created_at (timestamp)
    
    - notifications
      - id (uuid)
      - user_id (uuid, references profiles)
      - type (text)
      - content (text)
      - read (boolean)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create tables
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username text UNIQUE NOT NULL,
    full_name text,
    bio text,
    avatar_url text,
    church_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.churches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles
ADD CONSTRAINT fk_church
FOREIGN KEY (church_id)
REFERENCES public.churches(id)
ON DELETE SET NULL;

CREATE TABLE public.sermon_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    privacy text NOT NULL CHECK (privacy IN ('public', 'private', 'church')),
    church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.follows (
    follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE public.tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sermon_tags (
    sermon_id uuid REFERENCES public.sermon_notes(id) ON DELETE CASCADE,
    tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (sermon_id, tag_id)
);

CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermon_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermon_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Churches are viewable by everyone" ON public.churches
    FOR SELECT USING (true);

CREATE POLICY "Public sermon notes are viewable by everyone" ON public.sermon_notes
    FOR SELECT USING (
        privacy = 'public'
        OR (privacy = 'church' AND church_id IN (SELECT church_id FROM public.profiles WHERE id = auth.uid()))
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can insert their own sermon notes" ON public.sermon_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sermon notes" ON public.sermon_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sermon notes" ON public.sermon_notes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Tags are viewable by everyone" ON public.tags
    FOR SELECT USING (true);

CREATE POLICY "Users can manage sermon tags" ON public.sermon_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sermon_notes
            WHERE id = sermon_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();