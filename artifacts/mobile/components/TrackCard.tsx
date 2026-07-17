import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/context/AudioContext';
import { Track } from '@/types';

interface Props {
  track: Track;
  onPress: () => void;
  onMorePress?: () => void;
  index?: number;
}

export function TrackCard({ track, onPress, onMorePress, index }: Props) {
  const colors = useColors();
  const { currentTrack, isPlaying, isLoading } = useAudio();
  const isActive = currentTrack?.id === track.id;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.65}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbWrap, { borderRadius: colors.radius - 4 }]}>
        <Image
          source={{ uri: track.thumbnail }}
          style={[styles.thumbnail, { borderRadius: colors.radius - 4 }]}
          contentFit="cover"
          transition={200}
        />
        {isActive && (
          <View style={[StyleSheet.absoluteFill, styles.activeOverlay, { borderRadius: colors.radius - 4 }]}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : isPlaying ? (
              <Ionicons name="musical-note" size={18} color={colors.primary} />
            ) : (
              <Ionicons name="pause" size={18} color={colors.primary} />
            )}
          </View>
        )}
      </View>

      {/* Index */}
      {index !== undefined && (
        <Text style={[styles.index, { color: colors.mutedForeground }]}>
          {index + 1}
        </Text>
      )}

      {/* Track info */}
      <View style={styles.info}>
        <Text
          style={[
            styles.title,
            { color: isActive ? colors.primary : colors.foreground },
          ]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text
          style={[styles.artist, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {track.artist}
        </Text>
      </View>

      {/* Duration */}
      <Text style={[styles.duration, { color: colors.mutedForeground }]}>
        {track.durationFormatted}
      </Text>

      {/* More button */}
      {onMorePress && (
        <TouchableOpacity
          onPress={onMorePress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 4 }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  thumbWrap: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  thumbnail: {
    width: 52,
    height: 52,
  },
  activeOverlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: {
    width: 18,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
