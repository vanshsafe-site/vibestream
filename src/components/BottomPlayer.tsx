import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

function fmt(sec: number) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function BottomPlayer() {
  const p = usePlayer();
  const [showVol, setShowVol] = useState(false);
  const song = p.current;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-[76px] border-t border-border bg-surface">
      <div className="mx-auto flex h-full items-center gap-3 px-3 md:px-4">
        {/* Song */}
        <div className="flex min-w-0 items-center gap-3 basis-1/3 md:basis-1/4">
          {song?.cover_image ? (
            <img src={song.cover_image} alt="" width={48} height={48} loading="lazy" decoding="async"
              className="h-12 w-12 rounded object-cover shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded bg-accent shrink-0" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{song?.title ?? "Nothing playing"}</div>
            <div className="truncate text-xs text-muted-foreground">{song?.artist ?? "—"}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-2 md:gap-4 text-muted-foreground">
            <button aria-label="Shuffle" onClick={p.toggleShuffle}
              className={`hidden sm:inline-flex hover:text-foreground ${p.shuffle ? "text-primary" : ""}`}>
              <Shuffle size={16} />
            </button>
            <button aria-label="Previous" onClick={p.prev} className="hover:text-foreground"><SkipBack size={18} /></button>
            <button aria-label={p.isPlaying ? "Pause" : "Play"} onClick={p.toggle}
              className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background hover:scale-105 transition-transform">
              {p.isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <button aria-label="Next" onClick={p.next} className="hover:text-foreground"><SkipForward size={18} /></button>
            <button aria-label="Repeat" onClick={p.cycleRepeat}
              className={`hidden sm:inline-flex hover:text-foreground ${p.repeat !== "off" ? "text-primary" : ""}`}>
              {p.repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>
          <div className="hidden sm:flex w-full max-w-lg items-center gap-2 text-[10px] text-muted-foreground">
            <span className="tabular-nums w-8 text-right">{fmt(p.progress)}</span>
            <input
              type="range" min={0} max={p.duration || 0} step={1} value={p.progress}
              onChange={(e) => p.seek(Number(e.target.value))}
              className="flex-1 accent-primary h-1"
              aria-label="Seek"
            />
            <span className="tabular-nums w-8">{fmt(p.duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex basis-1/4 justify-end items-center gap-2 text-muted-foreground">
          <button aria-label="Mute" onClick={() => p.setVolume(p.volume > 0 ? 0 : 0.8)} className="hover:text-foreground">
            {p.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input type="range" min={0} max={1} step={0.01} value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            className="w-24 accent-primary h-1" aria-label="Volume" />
        </div>

        {/* Mobile mini-progress under bar */}
        <div className="md:hidden absolute left-0 right-0 bottom-[76px] h-0.5 bg-border">
          <div className="h-full bg-primary" style={{ width: `${p.duration ? (p.progress / p.duration) * 100 : 0}%` }} />
        </div>
      </div>
      {showVol && null}
    </div>
  );
}
