import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Song } from "@/types/music";
import { supabase } from "@/integrations/supabase/client";

type RepeatMode = "off" | "all" | "one";

interface PlayerCtx {
  queue: Song[];
  index: number;
  current: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  playQueue: (songs: Song[], startIndex?: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  // Single audio element for the whole app
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volume;
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime);
    const onDur = () => setDuration(audio.duration || 0);
    const onEnd = () => handleEnded();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = queue[index] ?? null;

  // Load new src when current changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.audio_url;
    audio.play().catch(() => {});
    // log history (best-effort)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) supabase.from("history").insert({ user_id: data.user.id, song_id: current.id });
    });
  }, [current?.id]);

  const handleEnded = useCallback(() => {
    setIndex((i) => {
      if (repeat === "one") {
        const a = audioRef.current;
        if (a) { a.currentTime = 0; a.play().catch(() => {}); }
        return i;
      }
      if (i + 1 < queue.length) return i + 1;
      if (repeat === "all") return 0;
      const a = audioRef.current; if (a) a.pause();
      return i;
    });
  }, [queue.length, repeat]);

  const playQueue = useCallback((songs: Song[], startIndex = 0) => {
    if (!songs.length) return;
    const ordered = shuffle ? shuffleArr(songs, startIndex) : songs;
    setQueue(ordered);
    setIndex(shuffle ? 0 : startIndex);
  }, [shuffle]);

  const toggle = useCallback(() => {
    const a = audioRef.current; if (!a || !current) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }, [current]);

  const next = useCallback(() => setIndex((i) => (i + 1 < queue.length ? i + 1 : (repeat === "all" ? 0 : i))), [queue.length, repeat]);
  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) { a.currentTime = 0; return; }
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);
  const seek = useCallback((t: number) => { const a = audioRef.current; if (a) a.currentTime = t; setProgress(t); }, []);
  const setVolume = useCallback((v: number) => { setVolumeState(v); const a = audioRef.current; if (a) a.volume = v; }, []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")), []);

  const value = useMemo<PlayerCtx>(() => ({
    queue, index, current, isPlaying, progress, duration, volume, shuffle, repeat,
    playQueue, toggle, next, prev, seek, setVolume, toggleShuffle, cycleRepeat,
  }), [queue, index, current, isPlaying, progress, duration, volume, shuffle, repeat, playQueue, toggle, next, prev, seek, setVolume, toggleShuffle, cycleRepeat]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer must be used within PlayerProvider");
  return v;
}

function shuffleArr<T>(arr: T[], keepFirstIndex: number): T[] {
  const first = arr[keepFirstIndex];
  const rest = arr.filter((_, i) => i !== keepFirstIndex);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [first, ...rest];
}
