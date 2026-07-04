import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SongCard, SongRow } from "@/components/SongTiles";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Song } from "@/types/music";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VibeStream — Stream Music You Love" },
      { name: "description", content: "Discover trending tracks, build playlists, and stream music instantly." },
      { property: "og:title", content: "VibeStream" },
      { property: "og:description", content: "Discover trending tracks and stream instantly." },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}

function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("songs").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setSongs((data ?? []) as Song[]);
      setLoading(false);
    });
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: h } = await supabase
        .from("history")
        .select("song_id, played_at, songs(*)")
        .order("played_at", { ascending: false })
        .limit(6);
      const arr = (h ?? []).map((r: any) => r.songs).filter(Boolean) as Song[];
      // dedupe
      const seen = new Set<string>();
      setHistory(arr.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))));
    });
  }, []);

  const trending = songs.slice(0, 6);
  const recent = songs.slice(0, 8);
  const genres = Array.from(new Set(songs.map((s) => s.genre).filter(Boolean))) as string[];

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-8">
      <Section title="Good evening" subtitle="Jump back in">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {(history.length ? history : trending.slice(0, 4)).slice(0, 6).map((s) => (
            <QuickTile key={s.id} song={s} queue={history.length ? history : trending} index={0} />
          ))}
        </div>
      </Section>

      <Section title="Trending now">
        <Grid>{trending.map((s, i) => <SongCard key={s.id} song={s} queue={trending} index={i} />)}</Grid>
      </Section>

      <Section title="Recently added">
        <Grid>{recent.map((s, i) => <SongCard key={s.id} song={s} queue={recent} index={i} />)}</Grid>
      </Section>

      {genres.length > 0 && (
        <Section title="Browse genres">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {genres.map((g, i) => (
              <div key={g} className="aspect-[16/10] rounded-lg p-3 font-bold text-lg text-white"
                style={{ background: gradients[i % gradients.length] }}>
                {g}
              </div>
            ))}
          </div>
        </Section>
      )}

      {history.length > 0 && (
        <Section title="Recently played">
          <div className="space-y-1">{history.map((s, i) => <SongRow key={s.id} song={s} queue={history} index={i} />)}</div>
        </Section>
      )}
    </div>
  );
}

const gradients = [
  "linear-gradient(135deg,#1DB954,#065f46)",
  "linear-gradient(135deg,#8b5cf6,#312e81)",
  "linear-gradient(135deg,#f43f5e,#7c2d12)",
  "linear-gradient(135deg,#0ea5e9,#0c4a6e)",
  "linear-gradient(135deg,#f59e0b,#7c2d12)",
  "linear-gradient(135deg,#ec4899,#831843)",
];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{children}</div>;
}

function QuickTile({ song, queue, index }: { song: Song; queue: Song[]; index: number }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-surface hover:bg-surface-elevated overflow-hidden pr-3">
      <div className="h-14 w-14 shrink-0 bg-accent">
        {song.cover_image && <img src={song.cover_image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 text-sm font-semibold truncate">{song.title}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((r) => (
        <div key={r}>
          <div className="mb-3 h-6 w-40 rounded bg-surface" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card-tile">
                <div className="aspect-square rounded-md bg-accent" />
                <div className="mt-2 h-3 w-2/3 rounded bg-accent" />
                <div className="mt-1 h-3 w-1/3 rounded bg-accent" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
