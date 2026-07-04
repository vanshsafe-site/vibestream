import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SongRow } from "@/components/SongTiles";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import type { Song } from "@/types/music";
import { Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — VibeStream" },
      { name: "description", content: "Search songs, artists, albums, and genres on VibeStream." },
    ],
  }),
  component: () => <AppShell><SearchPage /></AppShell>,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<Song[]>([]);

  useEffect(() => {
    supabase.from("songs").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setAll((data ?? []) as Song[]);
    });
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return all;
    return all.filter((s) =>
      s.title.toLowerCase().includes(t) ||
      s.artist.toLowerCase().includes(t) ||
      (s.album ?? "").toLowerCase().includes(t) ||
      (s.genre ?? "").toLowerCase().includes(t),
    );
  }, [q, all]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Songs, artists, albums, genres…"
          className="w-full rounded-full bg-surface pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="text-xs text-muted-foreground">{results.length} result{results.length === 1 ? "" : "s"}</div>
      <div className="space-y-1">
        {results.map((s, i) => <SongRow key={s.id} song={s} queue={results} index={i} />)}
      </div>
    </div>
  );
}
