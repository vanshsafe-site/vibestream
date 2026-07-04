import { Navigate } from "@tanstack/react-router";
import { useSession } from "@/hooks/useSession";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { BottomPlayer } from "@/components/BottomPlayer";
import { PlayerProvider } from "@/contexts/PlayerContext";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" />;

  return (
    <PlayerProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-w-0 pb-[96px] md:pb-[96px]">
            <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">{children}</div>
          </main>
        </div>
        <MobileNav />
        <BottomPlayer />
      </div>
    </PlayerProvider>
  );
}
