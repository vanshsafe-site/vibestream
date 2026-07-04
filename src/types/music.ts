export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number | null;
  cover_image: string | null;
  audio_url: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}
