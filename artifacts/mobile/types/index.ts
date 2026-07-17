export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  durationFormatted: string;
  thumbnail: string;
}

export type RepeatMode = 'none' | 'all' | 'one';
