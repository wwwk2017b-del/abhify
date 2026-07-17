import React, { useState, useRef } from 'react';
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
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/context/AudioContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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
    volume,
    showPlayer,
    setShowPlayer,
    togglePlay,
    seekTo,
    skipNext,
    skipPrev,
    toggleShuffle,
    toggleRepeat,
    setVolume,
  } = useAudio();

  const [isDragging, setIsDragging] = useState(false);
  const [dragMs, setDragMs] = useState(0);
  const barWidthRef = useRef(SCREEN_W - 48);

  const displayMs = isDragging ? dragMs : positionMs;
  const progress = durationMs > 0 ? displayMs / durationMs : 0;

  // Swipe down to close
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 15 && Math.abs(g.dx) < Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80) setShowPlayer(false);
    },
  });

  // Progress bar scrubbing
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

  if (!currentTrack) return null;

  const repeatIcon =
    repeat === 'one' ? 'repeat-once' : repeat === 'all' ? 'repeat' : 'repeat';
  const repeatColor =
    repeat !== 'none' ? colors.primary : colors.mutedForeground;

  return (
    <Modal
      visible={showPlayer}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowPlayer(false)}
    >
      <View style={[styles.container, { backgroundColor: '#000' }]} {...panResponder.panHandlers}>
        {/* Blurred album art background */}
        <Image
          source={{ uri: currentTrack.thumbnail }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={Platform.OS === 'android' ? 10 : 0}
        />
        {Platform.OS !== 'android' && (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)', '#000']}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.4, 1]}
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setShowPlayer(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {/* Album Art */}
          <View style={styles.artContainer}>
            <Image
              source={{ uri: currentTrack.thumbnail }}
              style={styles.albumArt}
              contentFit="cover"
            />
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {currentTrack.title}
            </Text>
            <Text style={[styles.trackArtist, { color: colors.mutedForeground }]}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* Progress Bar */}
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
                style={[
                  styles.progressThumb,
                  {
                    left: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: '#fff',
                    marginLeft: -8,
                  },
                ]}
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

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={toggleShuffle} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons
                name="shuffle"
                size={24}
                color={shuffle ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={skipPrev} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="play-skip-back" size={36} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlay}
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={skipNext} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="play-skip-forward" size={36} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleRepeat} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name={repeatIcon} size={24} color={repeatColor} />
            </TouchableOpacity>
          </View>

          {/* Volume */}
          <View style={styles.volumeRow}>
            <Ionicons name="volume-low" size={18} color={colors.mutedForeground} />
            <View style={[styles.volumeTrack, { backgroundColor: colors.border }]}>
              <View
                style={[styles.volumeFill, { width: `${volume * 100}%`, backgroundColor: colors.primary }]}
              />
            </View>
            <Ionicons name="volume-high" size={18} color={colors.mutedForeground} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 24,
  },
  artContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  albumArt: {
    width: SCREEN_W - 80,
    height: SCREEN_W - 80,
    borderRadius: 16,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  trackInfo: {
    alignItems: 'center',
    gap: 4,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  trackArtist: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  progressSection: {
    gap: 8,
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
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  volumeTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  volumeFill: {
    height: '100%',
    borderRadius: 2,
  },
});
