import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SongRow } from "@/components/SongTiles";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Playlist, Song } from "@/types/music";
import { Play, Plus, Trash2, Pencil } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "sonner";

export const Route = createFileRoute("/playlists/$id")({
  head: () => ({ meta: [{ title: "Playlist — VibeStream" }] }),
  component: () => <AppShell><PlaylistPage /></AppShell>,
  notFoundComponent: () => <AppShell><div>Playlist not found.</div></AppShell>,
  errorComponent: () => <AppShell><div>Couldn't load this playlist.</div></AppShell>,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const p = usePlayer();
  const [pl, setPl] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const load = async () => {
    const [{ data: plRow }, { data: rows }, { data: all }] = await Promise.all([
      supabase.from("playlists").select("*").eq("id", id).maybeSingle(),
      supabase.from("playlist_songs").select("added_at, songs(*)").eq("playlist_id", id).order("added_at", { ascending: true }),
      supabase.from("songs").select("*").order("created_at", { ascending: false }),
    ]);
    setPl(plRow as Playlist | null);
    setName((plRow as Playlist | null)?.name ?? "");
    setSongs(((rows ?? []).map((r: any) => r.songs).filter(Boolean)) as Song[]);
    setAllSongs((all ?? []) as Song[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const addSong = async (songId: string) => {
    const { error } = await supabase.from("playlist_songs").insert({ playlist_id: id, song_id: songId });
    if (error) return toast.error(error.message);
    load();
  };
  const removeSong = async (songId: string) => {
    await supabase.from("playlist_songs").delete().eq("playlist_id", id).eq("song_id", songId);
    load();
  };
  const rename = async () => {
    await supabase.from("playlists").update({ name }).eq("id", id);
    setEditing(false);
    load();
  };
  const del = async () => {
    if (!confirm("Delete this playlist?")) return;
    await supabase.from("playlists").delete().eq("id", id);
    navigate({ to: "/library" });
  };

  if (!pl) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const notInPlaylist = allSongs.filter((s) => !songs.find((x) => x.id === s.id));

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-end gap-4 rounded-xl p-6"
        style={{ background: "linear-gradient(135deg,#334155,#0f172a)" }}>
        <div className="h-24 w-24 rounded bg-black/30 grid place-items-center text-3xl font-black">{pl.name[0]?.toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Playlist</div>
          {editing ? (
            <div className="flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="rounded bg-background/40 px-2 py-1 text-2xl font-black" />
              <button onClick={rename} className="text-sm font-bold text-primary">Save</button>
            </div>
          ) : (
            <h1 className="text-3xl md:text-5xl font-black truncate">{pl.name}</h1>
          )}
          <div className="text-sm text-muted-foreground">{songs.length} songs</div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button disabled={!songs.length} onClick={() => p.playQueue(songs, 0)}
          className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg disabled:opacity-50">
          <Play size={20} className="ml-0.5" />
        </button>
        <button onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-1 rounded-md bg-surface px-3 py-2 text-sm">
          <Pencil size={14} /> Rename
        </button>
        <button onClick={del} className="inline-flex items-center gap-1 rounded-md bg-surface px-3 py-2 text-sm text-destructive">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      <div className="space-y-1">
        {songs.map((s, i) => (
          <div key={s.id} className="group relative">
            <SongRow song={s} queue={songs} index={i} />
            <button onClick={() => removeSong(s.id)}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {songs.length === 0 && <p className="text-sm text-muted-foreground">Add songs from below.</p>}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Add songs</h2>
        <div className="space-y-1">
          {notInPlaylist.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-accent">
                {s.cover_image && <img src={s.cover_image} loading="lazy" decoding="async" className="h-full w-full object-cover" alt="" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{s.title}</div>
                <div className="truncate text-xs text-muted-foreground">{s.artist}</div>
              </div>
              <button onClick={() => addSong(s.id)} className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs">
                <Plus size={14} /> Add
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
