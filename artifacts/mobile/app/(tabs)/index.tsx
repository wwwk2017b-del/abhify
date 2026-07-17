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
import { Butterflies } from '@/components/Butterflies';
import { Track } from '@/types';

const QUICK_MIX = [
  { id: 'qm1', label: 'Hip-Hop',    query: 'hip hop hits 2024',       colors: ['#7C3AED', '#4C1D95'] as const },
  { id: 'qm2', label: 'Electronic', query: 'electronic music mix',     colors: ['#5B21B6', '#1E3A8A'] as const },
  { id: 'qm3', label: 'Chill',      query: 'chill lo-fi beats',        colors: ['#6D28D9', '#065F46'] as const },
  { id: 'qm4', label: 'Rock',       query: 'rock classics best',       colors: ['#7C3AED', '#7F1D1D'] as const },
  { id: 'qm5', label: 'Pop Hits',   query: 'pop hits 2024',            colors: ['#A855F7', '#6D28D9'] as const },
  { id: 'qm6', label: 'Jazz',       query: 'jazz soul music',          colors: ['#5B21B6', '#4A1942'] as const },
];

const TAB_BAR_H = Platform.OS === 'web' ? 84 : Platform.OS === 'ios' ? 49 : 56;
const MINI_PLAYER_EXTRA = 76;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recentlyPlayed, playTrack, currentTrack } = useAudio();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = insets.bottom + TAB_BAR_H + (currentTrack ? MINI_PLAYER_EXTRA : 0);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Deep nebula gradient background */}
      <LinearGradient
        colors={['#1A0540', '#0C0221', '#0A001A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Purple glow orb at top */}
      <View style={styles.topGlow} pointerEvents="none">
        <LinearGradient
          colors={['#7C3AED33', '#A855F711', 'transparent']}
          style={{ flex: 1 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Animated butterflies in background */}
      <Butterflies />

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
            <Text style={[styles.appName, { color: colors.lavender }]}>Abhify</Text>
          </View>
          <View style={[styles.logoWrap, { backgroundColor: '#2A1045' }]}>
            <Ionicons name="musical-notes" size={22} color={colors.primary} />
          </View>
        </View>

        {/* Quick Mix */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Mix</Text>
        <View style={styles.quickGrid}>
          {QUICK_MIX.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.quickTile, { borderRadius: colors.radius, borderColor: colors.border + '80' }]}
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: item.query } })}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={item.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: colors.radius }]}
              />
              <Ionicons name="musical-note" size={16} color="rgba(216,180,254,0.7)" />
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
                  onPress={() => playTrack(item, recentlyPlayed)}
                  activeOpacity={0.75}
                  style={styles.recentCard}
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={[styles.recentArt, { borderRadius: colors.radius }]}
                    contentFit="cover"
                  />
                  {/* Purple overlay on recent art */}
                  <LinearGradient
                    colors={['transparent', '#0C022188']}
                    style={[StyleSheet.absoluteFill, { borderRadius: colors.radius, height: 130, top: 0 }]}
                  />
                  <Text
                    style={[styles.recentTitle, { color: colors.lavender }]}
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
            <Text style={[styles.emptyTitle, { color: colors.lavender }]}>
              No recent plays yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Search for a song to get started
            </Text>
          </View>
        )}
      </ScrollView>

      <PlayerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 28,
    zIndex: 10,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
    zIndex: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
    zIndex: 10,
  },
  quickTile: {
    width: '31%',
    aspectRatio: 1.6,
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 10,
    gap: 2,
    borderWidth: 1,
  },
  quickLabel: {
    color: '#F3E8FF',
    fontSize: 12,
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
    zIndex: 10,
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
