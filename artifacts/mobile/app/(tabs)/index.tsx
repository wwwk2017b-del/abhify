import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/context/AudioContext';
import { PlayerModal } from '@/components/PlayerModal';
import { FloatingImages } from '@/components/FloatingImages';
import { Track } from '@/types';

const QUICK_MIX = [
  { id: 'qm1', label: 'Hip-Hop', query: 'hip hop hits 2024', color: '#7C3AED' as const },
  { id: 'qm2', label: 'Electronic', query: 'electronic music mix', color: '#2563EB' as const },
  { id: 'qm3', label: 'Chill', query: 'chill lo-fi beats', color: '#059669' as const },
  { id: 'qm4', label: 'Rock', query: 'rock classics best', color: '#DC2626' as const },
  { id: 'qm5', label: 'Pop Hits', query: 'pop hits 2024', color: '#D97706' as const },
  { id: 'qm6', label: 'Jazz', query: 'jazz soul music', color: '#7C3AED' as const },
];

const MINI_PLAYER_EXTRA = 76; // mini player height + gap
const TAB_BAR_H = Platform.OS === 'web' ? 84 : Platform.OS === 'ios' ? 49 : 56;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recentlyPlayed, playTrack, currentTrack, showPlayer, setShowPlayer } = useAudio();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = insets.bottom + TAB_BAR_H + (currentTrack ? MINI_PLAYER_EXTRA : 0);

  const handleQuickMix = (query: string) => {
    router.push({ pathname: '/(tabs)/search', params: { q: query } });
  };

  const handleTrackPress = (track: Track) => {
    playTrack(track, recentlyPlayed);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Floating sticker background */}
      <FloatingImages />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 20, paddingBottom: bottomPad }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.appName, { color: colors.foreground }]}>Abhify</Text>
          </View>
          <View style={[styles.logoWrap, { backgroundColor: colors.muted }]}>
            <Ionicons name="musical-notes" size={22} color={colors.primary} />
          </View>
        </View>

        {/* Quick Mix */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Mix</Text>
        <View style={styles.quickGrid}>
          {QUICK_MIX.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.quickTile, { borderRadius: colors.radius }]}
              onPress={() => handleQuickMix(item.query)}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={[item.color, '#000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: colors.radius }]}
              />
              <Ionicons name="musical-note" size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recently Played
            </Text>
            <FlatList
              horizontal
              data={recentlyPlayed.slice(0, 12)}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleTrackPress(item)}
                  activeOpacity={0.75}
                  style={styles.recentCard}
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={[styles.recentArt, { borderRadius: colors.radius }]}
                    contentFit="cover"
                  />
                  <Text
                    style={[styles.recentTitle, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.recentArtist, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {item.artist}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </>
        ) : (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Ionicons name="headset-outline" size={42} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No recent plays yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Search for a song to get started
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Full-screen player */}
      <PlayerModal />
    </View>
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
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  logoWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  quickTile: {
    width: '31%',
    aspectRatio: 1.6,
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 10,
    gap: 2,
  },
  quickLabel: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  recentCard: {
    width: 130,
  },
  recentArt: {
    width: 130,
    height: 130,
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 17,
    marginBottom: 2,
  },
  recentArtist: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  emptyState: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 40,
    paddingVertical: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
