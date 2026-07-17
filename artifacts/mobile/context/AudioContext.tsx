import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, RepeatMode } from '@/types';

const RECENTLY_PLAYED_KEY = '@antigravity:recently_played';
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

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);

  // Refs for stable access inside callbacks (avoids stale closure)
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const repeatRef = useRef<RepeatMode>('none');
  const shuffleRef = useRef(false);
  const recentlyPlayedRef = useRef<Track[]>([]);
  const isLoadingRef = useRef(false);

  // React state for rendering
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('none');
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
      soundRef.current?.unloadAsync();
    };
  }, []);

  const loadRecentlyPlayed = async () => {
    try {
      const data = await AsyncStorage.getItem(RECENTLY_PLAYED_KEY);
      if (data) {
        const tracks = JSON.parse(data) as Track[];
        recentlyPlayedRef.current = tracks;
        setRecentlyPlayed(tracks);
      }
    } catch {}
  };

  const saveRecentlyPlayed = async (track: Track) => {
    const updated = [
      track,
      ...recentlyPlayedRef.current.filter((t) => t.id !== track.id),
    ].slice(0, MAX_RECENTLY_PLAYED);
    recentlyPlayedRef.current = updated;
    setRecentlyPlayed(updated);
    try {
      await AsyncStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Stable load function that reads exclusively from refs
  const internalLoadAndPlay = useCallback(async (track: Track) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setCurrentTrack(track);
    setPositionMs(0);
    setDurationMs(track.duration * 1000);

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? 'localhost';
      const streamUrl = `https://${domain}/api/stream/${track.id}`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500, volume: 1.0 },
        (status: AVPlaybackStatus) => handlePlaybackStatusRef.current?.(status),
      );
      soundRef.current = sound;
      await saveRecentlyPlayed(track);
    } catch {
      setIsPlaying(false);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []); // stable — reads only from refs and stable setters

  // Status callback ref — always points to latest closure without recreating the Sound
  const handlePlaybackStatusRef = useRef<(status: AVPlaybackStatus) => void>();

  handlePlaybackStatusRef.current = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis);
    if (status.durationMillis != null) setDurationMs(status.durationMillis);

    if (status.didJustFinish && !status.isLooping) {
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      const rep = repeatRef.current;
      const shuf = shuffleRef.current;

      if (rep === 'one') {
        soundRef.current?.replayAsync();
        return;
      }
      if (q.length === 0) return;

      let nextIdx: number;
      if (shuf) {
        nextIdx = Math.floor(Math.random() * q.length);
      } else {
        nextIdx = idx + 1;
        if (nextIdx >= q.length) {
          if (rep === 'all') nextIdx = 0;
          else return;
        }
      }
      queueIndexRef.current = nextIdx;
      setQueueIndex(nextIdx);
      internalLoadAndPlay(q[nextIdx]);
    }
  };

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      queueRef.current = newQueue;
      setQueueState(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      const safeIdx = idx >= 0 ? idx : 0;
      queueIndexRef.current = safeIdx;
      setQueueIndex(safeIdx);
    }
    setShowPlayer(true);
    await internalLoadAndPlay(track);
  };

  const togglePlay = async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const seekTo = async (ms: number) => {
    await soundRef.current?.setPositionAsync(ms);
    setPositionMs(ms);
  };

  const skipNext = async () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    const idx = queueIndexRef.current;
    const shuf = shuffleRef.current;
    const rep = repeatRef.current;
    let nextIdx = shuf ? Math.floor(Math.random() * q.length) : idx + 1;
    if (nextIdx >= q.length) {
      if (rep === 'all') nextIdx = 0;
      else return;
    }
    queueIndexRef.current = nextIdx;
    setQueueIndex(nextIdx);
    await internalLoadAndPlay(q[nextIdx]);
  };

  const skipPrev = async () => {
    if (positionMs > 3000) {
      await seekTo(0);
      return;
    }
    const q = queueRef.current;
    if (q.length === 0) return;
    const idx = queueIndexRef.current;
    const prevIdx = (idx - 1 + q.length) % q.length;
    queueIndexRef.current = prevIdx;
    setQueueIndex(prevIdx);
    await internalLoadAndPlay(q[prevIdx]);
  };

  const toggleShuffle = () => {
    const next = !shuffleRef.current;
    shuffleRef.current = next;
    setShuffle(next);
  };

  const toggleRepeat = () => {
    const order: RepeatMode[] = ['none', 'all', 'one'];
    const next = order[(order.indexOf(repeatRef.current) + 1) % order.length];
    repeatRef.current = next;
    setRepeat(next);
  };

  const setVolume = async (v: number) => {
    setVolumeState(v);
    await soundRef.current?.setVolumeAsync(v);
  };

  const addToQueue = (track: Track) => {
    const updated = [...queueRef.current, track];
    queueRef.current = updated;
    setQueueState(updated);
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
        toggleShuffle,
        toggleRepeat,
        setVolume,
        addToQueue,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
