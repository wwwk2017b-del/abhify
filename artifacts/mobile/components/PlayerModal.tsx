import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/context/AudioContext';
import { Butterflies } from '@/components/Butterflies';

const { width: SCREEN_W } = Dimensions.get('window');

const formatTime = (ms: number): string => {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export function PlayerModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    shuffle,
    repeat,
    showPlayer,
    setShowPlayer,
    togglePlay,
    seekTo,
    skipNext,
    skipPrev,
    toggleShuffle,
    toggleRepeat,
  } = useAudio();

  const [isDragging, setIsDragging] = useState(false);
  const [dragMs, setDragMs] = useState(0);
  const barWidthRef = useRef(SCREEN_W - 48);

  const displayMs = isDragging ? dragMs : positionMs;
  const progress = durationMs > 0 ? displayMs / durationMs : 0;

  // ── Kinetic pulse on play button ───────────────────────────────────────────
  const playScale = useSharedValue(1);
  const playGlow = useSharedValue(0.7);

  useEffect(() => {
    if (isPlaying) {
      playScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 420, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.96, { duration: 420, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
      playGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.5, { duration: 420, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else {
      playScale.value = withTiming(1, { duration: 250 });
      playGlow.value = withTiming(0.7, { duration: 250 });
    }
  }, [isPlaying]);

  // ── Skip buttons pulse on tap ──────────────────────────────────────────────
  const skipNextScale = useSharedValue(1);
  const skipPrevScale = useSharedValue(1);

  const pulseTap = (sv: typeof skipNextScale) => {
    sv.value = withSequence(
      withTiming(0.82, { duration: 90 }),
      withTiming(1.1, { duration: 130 }),
      withTiming(1, { duration: 120 }),
    );
  };

  const playBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
    shadowOpacity: playGlow.value * 0.75,
  }));

  const skipNextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipNextScale.value }],
  }));
  const skipPrevStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipPrevScale.value }],
  }));

  // ── Swipe down to dismiss ──────────────────────────────────────────────────
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      g.dy > 15 && Math.abs(g.dx) < Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80) setShowPlayer(false);
    },
  });

  // ── Scrub bar ──────────────────────────────────────────────────────────────
  const scrubPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsDragging(true);
      const x = Math.max(0, Math.min(evt.nativeEvent.locationX, barWidthRef.current));
      setDragMs((x / barWidthRef.current) * durationMs);
    },
    onPanResponderMove: (evt) => {
      const x = Math.max(0, Math.min(evt.nativeEvent.locationX, barWidthRef.current));
      setDragMs((x / barWidthRef.current) * durationMs);
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
      seekTo(dragMs);
    },
  });

  const repeatIcon = repeat === 'one' ? 'repeat-once' : 'repeat';
  const repeatColor = repeat !== 'none' ? colors.primary : colors.mutedForeground;

  if (!currentTrack) return null;

  return (
    <Modal
      visible={showPlayer}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowPlayer(false)}
    >
      <View style={styles.root} {...panResponder.panHandlers}>
        {/* Deep nebula background */}
        <LinearGradient
          colors={['#0C0221', '#1A0540', '#0C0221']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Nebula glow orb behind album art */}
        <View style={styles.glowOrb} pointerEvents="none">
          <LinearGradient
            colors={['#7C3AED44', '#A855F722', 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        {/* Butterflies float in the background */}
        <Butterflies />

        {/* Album art blurred bg */}
        <Image
          source={{ uri: currentTrack.thumbnail }}
          style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}
          contentFit="cover"
          blurRadius={Platform.OS === 'android' ? 20 : 0}
        />
        {Platform.OS !== 'android' && (
          <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} />
        )}

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => setShowPlayer(false)}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="chevron-down" size={28} color={colors.lavender} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.mutedForeground }]}>
            Now Playing
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Album Art */}
        <View style={styles.artWrap}>
          <Image
            source={{ uri: currentTrack.thumbnail }}
            style={styles.albumArt}
            contentFit="cover"
          />
          {/* Glow ring around art */}
          <View style={[styles.artGlow, { shadowColor: colors.neonPurple }]} />
        </View>

        {/* Track info */}
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: colors.foreground }]} numberOfLines={2}>
            {currentTrack.title}
          </Text>
          <Text style={[styles.trackArtist, { color: colors.mutedForeground }]}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
            onLayout={(e) => { barWidthRef.current = e.nativeEvent.layout.width; }}
            {...scrubPan.panHandlers}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.primary },
              ]}
            />
            <View
              style={[styles.progressThumb, { left: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.lavender }]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
              {formatTime(displayMs)}
            </Text>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
              {formatTime(durationMs)}
            </Text>
          </View>
        </View>

        {/* Controls — frosted glass panel */}
        <View style={styles.controlsOuter}>
          <BlurView intensity={40} tint="dark" style={styles.controlsBlur} />
          <View style={[styles.controlsBorder, { borderColor: colors.border }]} />

          <View style={styles.controls}>
            {/* Shuffle */}
            <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={toggleShuffle}>
              <Ionicons name="shuffle" size={24} color={shuffle ? colors.primary : colors.mutedForeground} />
            </TouchableOpacity>

            {/* Prev */}
            <Animated.View style={skipPrevStyle}>
              <TouchableOpacity
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => { pulseTap(skipPrevScale); skipPrev(); }}
              >
                <Ionicons name="play-skip-back" size={36} color={colors.foreground} />
              </TouchableOpacity>
            </Animated.View>

            {/* Play/Pause — pulsing kinetic button */}
            <Animated.View style={[styles.playBtnWrap, playBtnStyle]}>
              <TouchableOpacity
                onPress={togglePlay}
                style={[styles.playButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Next */}
            <Animated.View style={skipNextStyle}>
              <TouchableOpacity
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => { pulseTap(skipNextScale); skipNext(); }}
              >
                <Ionicons name="play-skip-forward" size={36} color={colors.foreground} />
              </TouchableOpacity>
            </Animated.View>

            {/* Repeat */}
            <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={toggleRepeat}>
              <MaterialCommunityIcons name={repeatIcon} size={24} color={repeatColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  glowOrb: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '65%',
    zIndex: 0,
  },
  glowGradient: {
    flex: 1,
  },
  artWrap: {
    alignItems: 'center',
    marginTop: 12,
    zIndex: 10,
  },
  albumArt: {
    width: SCREEN_W - 72,
    height: SCREEN_W - 72,
    borderRadius: 20,
  },
  artGlow: {
    position: 'absolute',
    width: SCREEN_W - 72,
    height: SCREEN_W - 72,
    borderRadius: 20,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 0,
  },
  trackInfo: {
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: 24,
    gap: 6,
    zIndex: 10,
  },
  trackTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 26,
  },
  trackArtist: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: 24,
    marginTop: 28,
    gap: 8,
    zIndex: 10,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  controlsOuter: {
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  controlsBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  playBtnWrap: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 18,
    elevation: 12,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
