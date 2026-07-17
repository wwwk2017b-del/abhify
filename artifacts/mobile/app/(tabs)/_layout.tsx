import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { MiniPlayer } from '@/components/MiniPlayer';
import { useAudio } from '@/context/AudioContext';

function NativeTabLayout() {
  const { currentTrack } = useAudio();

  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: 'house', selected: 'house.fill' }} />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search" role="search">
          <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
          <Label>Search</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="library">
          <Icon sf={{ default: 'music.note.list', selected: 'music.note.list' }} />
          <Label>Library</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      {currentTrack && <MiniPlayer />}
    </>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const { currentTrack } = useAudio();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: isIOS ? 'transparent' : colors.background,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={90}
                tint={isDark ? 'dark' : 'dark'}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.background },
                ]}
              />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="house" tintColor={color} size={22} />
              ) : (
                <Feather name="home" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="magnifyingglass" tintColor={color} size={22} />
              ) : (
                <Feather name="search" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="music.note.list" tintColor={color} size={22} />
              ) : (
                <Feather name="list" size={22} color={color} />
              ),
          }}
        />
      </Tabs>
      {currentTrack && <MiniPlayer />}
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
