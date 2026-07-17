import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/context/AudioContext';
import { TrackCard } from '@/components/TrackCard';
import { PlayerModal } from '@/components/PlayerModal';

const TAB_BAR_H = Platform.OS === 'web' ? 84 : Platform.OS === 'ios' ? 49 : 56;
const MINI_PLAYER_EXTRA = 76;

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recentlyPlayed, playTrack, currentTrack } = useAudio();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = insets.bottom + TAB_BAR_H + (currentTrack ? MINI_PLAYER_EXTRA : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#1A0540', '#0C0221', '#0A001A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <FlatList
        data={recentlyPlayed}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TrackCard
            track={item}
            onPress={() => playTrack(item, recentlyPlayed)}
            index={index}
          />
        )}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPad + 20 }]}>
            <Text style={[styles.heading, { color: colors.lavender }]}>Library</Text>
            {recentlyPlayed.length > 0 && (
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                {recentlyPlayed.length} track{recentlyPlayed.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="library-outline" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.lavender }]}>
              Your library is empty
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Songs you listen to will appear here
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/search')}
              style={[
                styles.searchBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
            >
              <Ionicons name="search" size={16} color="#fff" />
              <Text style={styles.searchBtnText}>Find music</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: bottomPad, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      <PlayerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
  },
  heading: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
