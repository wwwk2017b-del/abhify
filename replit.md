# Project Antigravity

A cross-platform dark-mode music streaming app that lets you search YouTube for any song and play audio ad-free in a custom neon-purple interface.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — start the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — start the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from the OpenAPI spec

## Stack

- **Frontend**: Expo (React Native), expo-router, expo-av, expo-blur, expo-linear-gradient
- **Backend**: Node.js + Express 5, play-dl (YouTube search & stream)
- **State**: React Context (AudioContext) + AsyncStorage for persistence
- **API**: pnpm workspaces, OpenAPI + Orval codegen, @tanstack/react-query

## Where things live

- `artifacts/mobile/` — Expo app
  - `app/(tabs)/` — Home, Search, Library screens
  - `context/AudioContext.tsx` — global audio playback state (source of truth)
  - `components/MiniPlayer.tsx` — floating mini player above tab bar
  - `components/PlayerModal.tsx` — full-screen player modal
  - `constants/colors.ts` — dark neon-purple design tokens
- `artifacts/api-server/src/routes/` — Express routes
  - `search.ts` — `GET /api/search?q=` using play-dl
  - `stream.ts` — `GET /api/stream/:id` pipes YouTube audio

## Architecture decisions

- **Audio proxied through backend**: play-dl streams audio server-side and pipes it to the Expo client via `Audio.Sound.createAsync({ uri: streamUrl })`. This avoids CORS issues and keeps YouTube URLs server-side.
- **Ref-based callback pattern**: AudioContext uses `useRef` for mutable values (queue, index, repeat, shuffle) read inside the expo-av playback status callback to avoid stale closures without complex re-subscription logic.
- **Forced dark mode**: `userInterfaceStyle: "dark"` in app.json ensures the system always reports dark mode, so `useColors()` always returns the dark palette.

## Product

- **Home**: Quick Mix genre tiles + Recently Played horizontal scroll
- **Search**: Real-time YouTube search with debounce, play / add-to-queue
- **Library**: Recently played track list, persisted via AsyncStorage
- **Mini Player**: Floating above the tab bar with progress bar
- **Full Player**: Full-screen modal with album art blur, scrub bar, shuffle/repeat, volume

## User preferences

_Populate as you build._

## Gotchas

- The backend uses `play-dl` as an `external` in esbuild (never bundle it — it has native deps)
- expo-av is deprecated in SDK 54 but still works. Migrate to `expo-audio` when ready.
- Stream endpoint proxies audio; scrubbing works via expo-av's `setPositionAsync` but depends on buffering.
