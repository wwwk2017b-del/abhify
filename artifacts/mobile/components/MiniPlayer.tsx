import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/context/AudioContext';

// Approximate tab bar heights by platform
const TAB_BAR_H = Platform.OS === 'web' ? 84 : Platform.OS === 'ios' ? 49 : 56;
const MINI_PLAYER_H = 68;

export function MiniPlayer() {
  const colors = useColors();
  const { bottom } = useSafeAreaInsets();
  const { currentTrack, isPlaying, isLoading, togglePlay, setShowPlayer, positionMs, durationMs } =
    useAudio();

  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (currentTrack) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const tabBarBottom = Platform.OS === 'web' ? 0 : bottom + TAB_BAR_H;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: tabBarBottom, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <TouchableOpacity
        style={styles.inner}
        onPress={() => setShowPlayer(true)}
        activeOpacity={0.8}
      >
        {/* Album art */}
        <Image
          source={{ uri: currentTrack.thumbnail }}
          style={[styles.art, { borderRadius: colors.radius - 6 }]}
          contentFit="cover"
        />

        {/* Track info */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={[styles.artist, { color: colors.mutedForeground }]} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={togglePlay}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color={colors.foreground}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: MINI_PLAYER_H,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  art: {
    width: 46,
    height: 46,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
