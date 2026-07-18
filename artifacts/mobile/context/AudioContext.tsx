import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Alert } from "react-native";
import { Audio } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track, RepeatMode } from "@/types";

const RECENTLY_PLAYED_KEY = "@abhify:recently_played";
const MAX_RECENTLY_PLAYED = 30;

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  isLoading: boolean;
  recentlyPlayed: Track[];
  queue: Track[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  showPlayer: boolean;
  setShowPlayer: (show: boolean) => void;
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (v: number) => Promise<void>;
  addToQueue: (track: Track) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

function showPlayError(trackTitle: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[AudioContext] Play error:", msg);
  Alert.alert(
    "⚠️ Playback Failed",
    `Could not play "${trackTitle}".\n\nError: ${msg}`,
  );
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);

  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const repeatRef = useRef<RepeatMode>("none");
  const shuffleRef = useRef(false);
  const isLoadingRef = useRef(false);
  const currentTrackRef = useRef<Track | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const [volume, setVolumeState] = useState(1.0);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    loadRecentlyPlayed();
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const loadRecentlyPlayed = async () => {
    try {
      const data = await AsyncStorage.getItem(RECENTLY_PLAYED_KEY);
      if (data) setRecentlyPlayed(JSON.parse(data) as Track[]);
    } catch (e) {
      console.warn(e);
    }
  };

  const saveRecentlyPlayed = async (track: Track) => {
    const updated = [
      track,
      ...recentlyPlayed.filter((t) => t.id !== track.id),
    ].slice(0, MAX_RECENTLY_PLAYED);
    setRecentlyPlayed(updated);
    try {
      await AsyncStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ((status as any).error) {
        const track = currentTrackRef.current;
        const errMsg = (status as any).error;
        setIsPlaying(false);
        setIsLoading(false);
        isLoadingRef.current = false;
        if (track) showPlayError(track.title, errMsg);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis);
    if (status.durationMillis != null) setDurationMs(status.durationMillis);

    if (status.didJustFinish && !status.isLooping) {
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      const rep = repeatRef.current;
      const shuf = shuffleRef.current;

      if (rep === "one") {
        soundRef.current?.replayAsync().catch(() => {});
        return;
      }
      if (q.length === 0) return;

      let nextIdx = shuf ? Math.floor(Math.random() * q.length) : idx + 1;
      if (nextIdx >= q.length) {
        if (rep === "all") nextIdx = 0;
        else return;
      }
      queueIndexRef.current = nextIdx;
      setQueueIndex(nextIdx);
      const nextTrack = q[nextIdx];
      if (nextTrack) internalLoadAndPlay(nextTrack);
    }
  }, []);

  const internalLoadAndPlay = useCallback(
    async (track: Track) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTrack(track);
      currentTrackRef.current = track;
      setPositionMs(0);
      setDurationMs(track.duration > 0 ? track.duration * 1000 : 0);

      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }

      // FRESH ENDPOINT CLUSTER
      const apiMirrors = [
        "https://pipedapi.adminforge.de",
        "https://pipedapi.leptons.xyz",
        "https://pipedapi.reallyaweso.me",
        "https://piped-api.lunar.icu",
        "https://api.piped.yt",
      ];

      let audioStreamUrl = "";
      let lastError = "All servers timed out.";

      for (const mirror of apiMirrors) {
        try {
          const targetUrl = `${mirror}/streams/${track.id}`;
          console.log(
            `[AudioContext] Trying target cluster node: ${targetUrl}`,
          );

          // Increased safety window to 10 seconds for deep parsing
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(targetUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) throw new Error(`Status ${res.status}`);

          const streamData = await res.json();
          const audioStream =
            streamData.audioStreams?.find((s: any) =>
              s.mimeType?.includes("audio"),
            ) || streamData.audioStreams?.[0];

          if (audioStream?.url) {
            audioStreamUrl = audioStream.url;
            console.log(
              `[AudioContext] Connected successfully using node: ${mirror}`,
            );
            break;
          }
        } catch (err: any) {
          console.warn(
            `[AudioContext] Shifting from node ${mirror}:`,
            err.message || err,
          );
          lastError = err.message || String(err);
        }
      }

      try {
        if (!audioStreamUrl)
          throw new Error(`Music pipeline full. Details: ${lastError}`);

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioStreamUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 500, volume: 1.0 },
          onPlaybackStatusUpdate,
        );

        soundRef.current = sound;
        await saveRecentlyPlayed(track);
      } catch (err) {
        setIsPlaying(false);
        soundRef.current = null;
        showPlayError(track.title, err);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [onPlaybackStatusUpdate],
  );

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (newQueue && newQueue.length > 0) {
      queueRef.current = newQueue;
      setQueueState(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      queueIndexRef.current = idx >= 0 ? idx : 0;
      setQueueIndex(queueIndexRef.current);
    }
    setShowPlayer(true);
    await internalLoadAndPlay(track);
  };

  const togglePlay = async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) await soundRef.current.pauseAsync();
        else await soundRef.current.playAsync();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const seekTo = async (ms: number) => {
    try {
      await soundRef.current?.setPositionAsync(ms);
      setPositionMs(ms);
    } catch (err) {
      console.warn(err);
    }
  };

  const skipNext = async () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    let nextIdx = shuffleRef.current
      ? Math.floor(Math.random() * q.length)
      : queueIndexRef.current + 1;
    if (nextIdx >= q.length) {
      if (repeatRef.current === "all") nextIdx = 0;
      else return;
    }
    queueIndexRef.current = nextIdx;
    setQueueIndex(nextIdx);
    const nextTrack = q[nextIdx];
    if (nextTrack) await internalLoadAndPlay(nextTrack);
  };

  const skipPrev = async () => {
    if (positionMs > 3000) {
      await seekTo(0);
      return;
    }
    const q = queueRef.current;
    if (q.length === 0) return;
    const prevIdx = (queueIndexRef.current - 1 + q.length) % q.length;
    queueIndexRef.current = prevIdx;
    setQueueIndex(prevIdx);
    const prevTrack = q[prevIdx];
    if (prevTrack) await internalLoadAndPlay(prevTrack);
  };

  const toggleShuffle = () => {
    shuffleRef.current = !shuffleRef.current;
    setShuffle(shuffleRef.current);
  };

  const toggleRepeat = () => {
    const order: RepeatMode[] = ["none", "all", "one"];
    const next = order[(order.indexOf(repeatRef.current) + 1) % order.length]!;
    repeatRef.current = next;
    setRepeat(next);
  };

  const setVolume = async (v: number) => {
    setVolumeState(v);
    try {
      await soundRef.current?.setVolumeAsync(v);
    } catch {}
  };

  const addToQueue = (track: Track) => {
    queueRef.current = [...queueRef.current, track];
    setQueueState(queueRef.current);
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        positionMs,
        durationMs,
        isLoading,
        recentlyPlayed,
        queue,
        queueIndex,
        shuffle,
        repeat,
        volume,
        showPlayer,
        setShowPlayer,
        playTrack,
        togglePlay,
        seekTo,
        skipNext,
        skipPrev,
        setVolume,
        addToQueue,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
