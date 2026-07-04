import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Heart, ListMusic, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Playlist } from "@/types/music";

const links = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/search", label: "Search", Icon: Search },
  { to: "/library", label: "Library", Icon: Library },
  { to: "/favorites", label: "Favorites", Icon: Heart },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    supabase.from("playlists").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setPlaylists(data as Playlist[]);
    });
    const ch = supabase.channel("sidebar-playlists").on("postgres_changes",
      { event: "*", schema: "public", table: "playlists" },
      () => {
        supabase.from("playlists").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          if (data) setPlaylists(data as Playlist[]);
        });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col gap-2 bg-surface p-3 h-[calc(100vh-96px)] sticky top-0">
      <div className="px-2 py-3">
        <Link to="/" className="text-xl font-black tracking-tight text-primary">VibeStream</Link>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }`}
            >
              <Icon size={18} /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 flex-1 min-h-0 flex flex-col rounded-md bg-background/40">
        <div className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2"><ListMusic size={14} /> Playlists</span>
        </div>
        <ul className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {playlists.map((p) => (
            <li key={p.id}>
              <Link to="/playlists/$id" params={{ id: p.id }}
                className="block truncate rounded px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60">
                {p.name}
              </Link>
            </li>
          ))}
          {playlists.length === 0 && (
            <li className="px-2 py-1 text-xs text-muted-foreground">No playlists yet</li>
          )}
        </ul>
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60"
      >
        <LogOut size={16} /> Log out
      </button>
    </aside>
  );
}

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-[76px] left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-sm">
      <ul className="grid grid-cols-4">
        {links.map(({ to, label, Icon }) => {
          const active = path === to;
          return (
            <li key={to}>
              <Link to={to} className={`flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon size={20} /> {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
