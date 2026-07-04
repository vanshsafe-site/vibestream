
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SONGS
CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  genre TEXT,
  duration INT,
  cover_image TEXT,
  audio_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.songs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.songs TO authenticated;
GRANT ALL ON public.songs TO service_role;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Songs are viewable by everyone" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Users can insert songs" ON public.songs FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- PLAYLISTS
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO authenticated;
GRANT ALL ON public.playlists TO service_role;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own playlists" ON public.playlists FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PLAYLIST SONGS
CREATE TABLE public.playlist_songs (
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, song_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_songs TO authenticated;
GRANT ALL ON public.playlist_songs TO service_role;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View playlist songs of own playlists" ON public.playlist_songs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()));
CREATE POLICY "Modify playlist songs of own playlists" ON public.playlist_songs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()));

-- FAVORITES
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, song_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- HISTORY
CREATE TABLE public.history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX history_user_played_idx ON public.history (user_id, played_at DESC);
GRANT SELECT, INSERT, DELETE ON public.history TO authenticated;
GRANT ALL ON public.history TO service_role;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own history" ON public.history FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SEED SONGS (royalty-free SoundHelix demo tracks)
INSERT INTO public.songs (title, artist, album, genre, duration, cover_image, audio_url) VALUES
('Neon Drift', 'Aurora Wave', 'Midnight Sessions', 'Electronic', 372,
  'https://picsum.photos/seed/neon-drift/600/600',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
('Solar Bloom', 'Kite Republic', 'Sunfields', 'Indie', 425,
  'https://picsum.photos/seed/solar-bloom/600/600',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
('Velvet Circuit', 'Nova Kids', 'Analog Dreams', 'Synthwave', 407,
  'https://picsum.photos/seed/velvet-circuit/600/600',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
('Paper Planes', 'The Hollow Coast', 'Fieldnotes', 'Folk', 296,
  'https://picsum.photos/seed/paper-planes/600/600',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'),
('Glass Horizons', 'Echo Atlas', 'Blueprints', 'Ambient', 356,
  'https://picsum.photos/seed/glass-horizons/600/600',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'),
('Late Night Radio', 'Suburban Static', 'Signal Loss', 'Lo-fi', 314,
  'https://picsum.photos/seed/late-night-radio/600/600',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3');
