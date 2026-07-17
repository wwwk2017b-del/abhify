import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAudio } from '@/context/AudioContext';
import { TrackCard } from '@/components/TrackCard';
import { PlayerModal } from '@/components/PlayerModal';
import { useSearchTracks } from '@workspace/api-client-react';
import type { Track } from '@workspace/api-client-react';

const TAB_BAR_H = Platform.OS === 'web' ? 84 : Platform.OS === 'ios' ? 49 : 56;
const MINI_PLAYER_EXTRA = 76;

const SUGGESTIONS = [
  'Kendrick Lamar', 'Taylor Swift', 'The Weeknd', 'Drake',
  'Billie Eilish', 'Post Malone', 'Dua Lipa', 'Bad Bunny',
];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const { playTrack, addToQueue, currentTrack } = useAudio();

  const [inputText, setInputText] = useState(params.q ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(params.q ?? '');

  // Sync param changes (from Quick Mix)
  useEffect(() => {
    if (params.q) {
      setInputText(params.q);
      setDebouncedQuery(params.q);
    }
  }, [params.q]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputText.trim()), 450);
    return () => clearTimeout(t);
  }, [inputText]);

  const { data: tracks = [], isLoading, isError, refetch } = useSearchTracks(
    { q: debouncedQuery, limit: 30 },
    { query: { enabled: debouncedQuery.length > 0 } },
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = insets.bottom + TAB_BAR_H + (currentTrack ? MINI_PLAYER_EXTRA : 0);

  const handlePlay = useCallback((track: Track) => {
    Keyboard.dismiss();
    playTrack(track as any, tracks as any);
  }, [playTrack, tracks]);

  const handleAddToQueue = useCallback((track: Track) => {
    addToQueue(track as any);
  }, [addToQueue]);

  const handleClear = () => {
    setInputText('');
    setDebouncedQuery('');
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    if (debouncedQuery.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={[styles.suggestLabel, { color: colors.mutedForeground }]}>
            Try searching for
          </Text>
          <View style={styles.chips}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setInputText(s)}
                style={[styles.chip, { backgroundColor: colors.secondary, borderRadius: 20 }]}
              >
                <Text style={[styles.chipText, { color: colors.foreground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Search failed</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Try a different search term
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { paddingTop: topPad + 12 }]}>
        <View
          style={[
            styles.inputWrap,
            { backgroundColor: colors.secondary, borderRadius: colors.radius },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Artists, songs, podcasts"
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={colors.primary}
          />
          {inputText.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Searching...
          </Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TrackCard
            track={item as any}
            onPress={() => handlePlay(item)}
            onMorePress={() => handleAddToQueue(item)}
            index={index}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: bottomPad, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <PlayerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 12,
  },
  suggestLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
