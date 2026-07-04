import { usePlayer } from "@/contexts/PlayerContext";
import type { Song } from "@/types/music";
import { Play, Pause, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function SongCard({ song, queue, index }: { song: Song; queue: Song[]; index: number }) {
  const p = usePlayer();
  const isCurrent = p.current?.id === song.id;
  return (
    <button
      onClick={() => (isCurrent ? p.toggle() : p.playQueue(queue, index))}
      className="group text-left card-tile hover:bg-surface-elevated"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-accent">
        {song.cover_image && (
          <img src={song.cover_image} alt={song.title} loading="lazy" decoding="async"
            className="h-full w-full object-cover" />
        )}
        <span className="absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {isCurrent && p.isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold">{song.title}</div>
      <div className="truncate text-xs text-muted-foreground">{song.artist}</div>
    </button>
  );
}

export function SongRow({ song, queue, index, showAlbum = true }: { song: Song; queue: Song[]; index: number; showAlbum?: boolean }) {
  const p = usePlayer();
  const isCurrent = p.current?.id === song.id;
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let cancel = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("favorites").select("id").eq("user_id", data.user.id).eq("song_id", song.id).maybeSingle()
        .then(({ data: fav }) => { if (!cancel) setLiked(!!fav); });
    });
    return () => { cancel = true; };
  }, [song.id]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    if (liked) {
      await supabase.from("favorites").delete().eq("user_id", data.user.id).eq("song_id", song.id);
      setLiked(false);
    } else {
      await supabase.from("favorites").insert({ user_id: data.user.id, song_id: song.id });
      setLiked(true);
    }
  };

  return (
    <div
      onClick={() => (isCurrent ? p.toggle() : p.playQueue(queue, index))}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-accent/60 ${isCurrent ? "bg-accent/40" : ""}`}
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-accent">
        {song.cover_image && <img src={song.cover_image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0">
        <div className={`truncate text-sm font-semibold ${isCurrent ? "text-primary" : ""}`}>{song.title}</div>
        <div className="truncate text-xs text-muted-foreground">{song.artist}</div>
      </div>
      {showAlbum && <div className="hidden sm:block min-w-0 truncate text-xs text-muted-foreground">{song.album}</div>}
      <button onClick={toggleLike} aria-label="Like" className={`hidden sm:inline-flex ${liked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
        <Heart size={16} fill={liked ? "currentColor" : "none"} />
      </button>
      <div className="text-xs tabular-nums text-muted-foreground w-10 text-right">{song.duration ? fmt(song.duration) : "—"}</div>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
