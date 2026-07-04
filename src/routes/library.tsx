import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Playlist, Song } from "@/types/music";
import { Plus, Heart, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Your library — VibeStream" },
      { name: "description", content: "Your playlists, liked songs, and listening history." },
    ],
  }),
  component: () => <AppShell><Library /></AppShell>,
});

function Library() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const [{ data: pls }, { data: hs }] = await Promise.all([
      supabase.from("playlists").select("*").order("created_at", { ascending: false }),
      supabase.from("history").select("song_id, played_at, songs(*)").order("played_at", { ascending: false }).limit(20),
    ]);
    setPlaylists((pls ?? []) as Playlist[]);
    const arr = (hs ?? []).map((r: any) => r.songs).filter(Boolean) as Song[];
    const seen = new Set<string>();
    setHistory(arr.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !name.trim()) return;
    const { error } = await supabase.from("playlists").insert({ user_id: u.user.id, name: name.trim() });
    if (error) return toast.error(error.message);
    setName("");
    toast.success("Playlist created");
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Your library</h1>

      <form onSubmit={create} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New playlist name"
          className="flex-1 rounded-md bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
        <button className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
          <Plus size={16} /> Create
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-bold">Playlists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link to="/favorites" className="card-tile hover:bg-surface-elevated flex flex-col justify-end aspect-square"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#1DB954)" }}>
            <Heart className="mb-2" />
            <div className="font-bold">Liked Songs</div>
          </Link>
          {playlists.map((p) => (
            <Link key={p.id} to="/playlists/$id" params={{ id: p.id }}
              className="card-tile hover:bg-surface-elevated flex flex-col justify-end aspect-square"
              style={{ background: "linear-gradient(135deg,#334155,#0f172a)" }}>
              <div className="font-bold truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">Playlist</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Clock size={18} /> Recently played</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing played yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {history.map((s) => (
              <div key={s.id} className="card-tile">
                <div className="aspect-square overflow-hidden rounded bg-accent">
                  {s.cover_image && <img src={s.cover_image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                </div>
                <div className="mt-2 truncate text-sm font-semibold">{s.title}</div>
                <div className="truncate text-xs text-muted-foreground">{s.artist}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
