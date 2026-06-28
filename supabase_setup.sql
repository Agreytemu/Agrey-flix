-- SUPABASE SETUP SCRIPT FOR WEFLIX PORTAL
-- Run this script in the Supabase SQL Editor (https://supabase.com) to initialize your database structure,
-- configure automatic user synchronization, and enable Row-Level Security (RLS).

-- 1. Create the public profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  watchlist JSONB DEFAULT '[]'::jsonb,
  continue_watching JSONB DEFAULT '[]'::jsonb,
  preferences_set BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Allow users to view only their own profile
CREATE POLICY "Allow individual read access" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Allow users to update only their own profile
CREATE POLICY "Allow individual update access" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Allow users to insert their own profile
CREATE POLICY "Allow individual insert access" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Create automatic user creation trigger function from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url, watchlist, continue_watching, preferences_set, preferences)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'displayName', new.raw_user_meta_data->>'full_name', 'Guest User'),
    new.raw_user_meta_data->>'photoURL',
    COALESCE(new.raw_user_meta_data->'watchlist', '[]'::jsonb),
    COALESCE(new.raw_user_meta_data->'continueWatching', '[]'::jsonb),
    COALESCE((new.raw_user_meta_data->>'preferencesSet')::boolean, false),
    COALESCE(new.raw_user_meta_data->'preferences', '{}'::jsonb)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach the trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger to automatically update the 'updated_at' column on row modification
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- 7. Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin INTEGER DEFAULT 0;

-- 8. Create the public notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Enable Row Level Security (RLS) on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies for notifications

-- Policy: Allow everyone (even anonymous/authenticated users) to select notifications
CREATE POLICY "Allow public read access to notifications" ON public.notifications
  FOR SELECT
  USING (true);

-- Policy: Allow only admins to insert notifications (checked by profiles.is_admin = 1)
CREATE POLICY "Allow admin insert access to notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = 1
    )
  );

-- Policy: Allow only admins to delete/update notifications
CREATE POLICY "Allow admin delete access to notifications" ON public.notifications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = 1
    )
  );


-- 11. Create the public reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  media_id TEXT,
  type TEXT,
  issue_type TEXT,
  details TEXT,
  reporter_email TEXT,
  status TEXT DEFAULT 'pending',
  admin_response TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Enable Row Level Security (RLS) on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS Policies for reports
-- Allow anyone to insert reports
DROP POLICY IF EXISTS "Allow anyone to insert reports" ON public.reports;
CREATE POLICY "Allow anyone to insert reports" ON public.reports
  FOR INSERT
  WITH CHECK (true);

-- Allow public read access to reports (for admins to view, or simple listing)
DROP POLICY IF EXISTS "Allow public read access to reports" ON public.reports;
CREATE POLICY "Allow public read access to reports" ON public.reports
  FOR SELECT
  USING (true);

-- Allow only admins to update reports
DROP POLICY IF EXISTS "Allow admin update access to reports" ON public.reports;
CREATE POLICY "Allow admin update access to reports" ON public.reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = 1
    )
  );

-- Allow only admins to delete reports
DROP POLICY IF EXISTS "Allow admin delete access to reports" ON public.reports;
CREATE POLICY "Allow admin delete access to reports" ON public.reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = 1
    )
  );


-- 14. Create the public servers table
CREATE TABLE IF NOT EXISTS public.servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'Active (100% SLA)',
  latency INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Enable Row Level Security (RLS) on servers table
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- 16. Create RLS Policies for servers
-- Allow public read access to servers
DROP POLICY IF EXISTS "Allow public read access to servers" ON public.servers;
CREATE POLICY "Allow public read access to servers" ON public.servers
  FOR SELECT
  USING (true);

-- Allow admins to perform all operations on servers
DROP POLICY IF EXISTS "Allow admin write access to servers" ON public.servers;
CREATE POLICY "Allow admin write access to servers" ON public.servers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = 1
    )
  );

-- Seed initial servers data
INSERT INTO public.servers (id, name, url, status, latency)
VALUES 
  ('srv_1', 'Server 1 (Primary High-Bitrate)', 'https://vidsrc.to/', 'Active (100% SLA)', 42),
  ('srv_2', 'Server 2 (Backup Ultra-CDN)', 'https://vidsrc.me/', 'Active (99.8% SLA)', 85),
  ('srv_3', 'Server 3 (Vidsrc.ru Premium Stream Host)', 'https://vidsrc-embed.ru/', 'Active (100% SLA)', 35)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, url = EXCLUDED.url, status = EXCLUDED.status, latency = EXCLUDED.latency;


-- 17. Create the public tiktok_videos table
CREATE TABLE IF NOT EXISTS public.tiktok_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tiktok_url TEXT NOT NULL,
  thumbnail TEXT,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  shares_count INTEGER DEFAULT 0 NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Upgrade existing table if it was created without columns
ALTER TABLE public.tiktok_videos ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.tiktok_videos ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0 NOT NULL;

-- 18. Enable Row Level Security (RLS) on tiktok_videos table
ALTER TABLE public.tiktok_videos ENABLE ROW LEVEL SECURITY;

-- 19. Create RLS Policies for tiktok_videos
-- Allow public read access to tiktok_videos
DROP POLICY IF EXISTS "Allow public read access to tiktok_videos" ON public.tiktok_videos;
CREATE POLICY "Allow public read access to tiktok_videos" ON public.tiktok_videos
  FOR SELECT
  USING (true);

-- Allow admins to perform all operations on tiktok_videos
DROP POLICY IF EXISTS "Allow admin write access to tiktok_videos" ON public.tiktok_videos;
CREATE POLICY "Allow admin write access to tiktok_videos" ON public.tiktok_videos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = 1
    )
  );



