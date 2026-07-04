import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SongRow } from "@/components/SongTiles";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Song } from "@/types/music";
import { Heart } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Liked songs — VibeStream" },
      { name: "description", content: "Every track you've hearted, all in one place." },
    ],
  }),
  component: () => <AppShell><Favorites /></AppShell>,
});

function Favorites() {
  const [songs, setSongs] = useState<Song[]>([]);
  const p = usePlayer();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rows } = await supabase
        .from("favorites")
        .select("created_at, songs(*)")
        .order("created_at", { ascending: false });
      setSongs(((rows ?? []).map((r: any) => r.songs).filter(Boolean)) as Song[]);
    });
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-end gap-4 rounded-xl p-6" style={{ background: "linear-gradient(135deg,#8b5cf6,#1DB954)" }}>
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded bg-black/30">
          <Heart size={40} fill="currentColor" />
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider">Playlist</div>
          <h1 className="text-3xl md:text-5xl font-black">Liked Songs</h1>
          <div className="text-sm text-white/80">{songs.length} songs</div>
        </div>
      </header>
      <div className="flex gap-3">
        <button
          disabled={!songs.length}
          onClick={() => p.playQueue(songs, 0)}
          className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Play size={20} className="ml-0.5" />
        </button>
      </div>
      <div className="space-y-1">
        {songs.length === 0 && <p className="text-sm text-muted-foreground">No liked songs yet. Tap the heart on any track.</p>}
        {songs.map((s, i) => <SongRow key={s.id} song={s} queue={songs} index={i} />)}
      </div>
    </div>
  );
}
