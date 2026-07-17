import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

// All 15 sticker images — static requires so Metro can bundle them
const ALL_IMAGES = [
  require('../assets/images/floaties/f01.jpg'),
  require('../assets/images/floaties/f02.jpg'),
  require('../assets/images/floaties/f03.jpg'),
  require('../assets/images/floaties/f04.jpg'),
  require('../assets/images/floaties/f05.jpg'),
  require('../assets/images/floaties/f06.jpg'),
  require('../assets/images/floaties/f07.jpg'),
  require('../assets/images/floaties/f08.jpg'),
  require('../assets/images/floaties/f09.jpg'),
  require('../assets/images/floaties/f10.jpg'),
  require('../assets/images/floaties/f11.jpg'),
  require('../assets/images/floaties/f12.jpg'),
  require('../assets/images/floaties/f13.jpg'),
  require('../assets/images/floaties/f14.jpg'),
  require('../assets/images/floaties/f15.jpg'),
];

// Deterministic "random" seeded layout so positions are stable across re-renders
function seededFloat(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return min + (x - Math.floor(x)) * (max - min);
}

interface FloatieConfig {
  src: ReturnType<typeof require>;
  baseX: number;      // fixed left anchor (px)
  baseY: number;      // fixed top anchor (px)
  size: number;       // width & height
  driftXRange: number; // how far to drift horizontally
  driftYRange: number; // how far to drift vertically
  rotateDeg: number;   // max rotation degrees
  opacity: number;     // final opacity
  driftSpeed: number;  // ms per one-way drift
  phaseOffset: number; // 0-1 stagger
  borderRadius: number;
}

// Build a stable array of 18 floaties (some images repeat, staggered across screen)
function buildFloaties(): FloatieConfig[] {
  const configs: FloatieConfig[] = [];
  const count = 18;
  for (let i = 0; i < count; i++) {
    const s = i + 1;
    configs.push({
      src: ALL_IMAGES[i % ALL_IMAGES.length],
      baseX: seededFloat(s * 3, -30, SW - 40),
      baseY: seededFloat(s * 7, -20, SH - 60),
      size: seededFloat(s * 11, 52, 82),
      driftXRange: seededFloat(s * 5, 28, 70),
      driftYRange: seededFloat(s * 13, 22, 55),
      rotateDeg: seededFloat(s * 17, 10, 28),
      opacity: seededFloat(s * 19, 0.28, 0.48),
      driftSpeed: seededFloat(s * 23, 5500, 11000),
      phaseOffset: seededFloat(s * 29, 0, 1),
      borderRadius: seededFloat(s * 31, 6, 24),
    });
  }
  return configs;
}

const FLOATIES = buildFloaties();

// ─── Single animated sticker ──────────────────────────────────────────────────
function Floatie({ cfg }: { cfg: FloatieConfig }) {
  const driftX = useRef(new Animated.Value(0)).current;
  const driftY = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in with a staggered delay
    Animated.timing(fade, {
      toValue: 1,
      duration: 1200,
      delay: cfg.phaseOffset * 2000,
      useNativeDriver: true,
    }).start();

    // Continuous X drift: -range → +range → -range, looping
    const xAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(driftX, {
          toValue: cfg.driftXRange,
          duration: cfg.driftSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(driftX, {
          toValue: -cfg.driftXRange,
          duration: cfg.driftSpeed,
          useNativeDriver: true,
        }),
      ]),
    );

    // Continuous Y drift (different speed for organic feel)
    const yAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(driftY, {
          toValue: cfg.driftYRange,
          duration: cfg.driftSpeed * 0.73,
          useNativeDriver: true,
        }),
        Animated.timing(driftY, {
          toValue: -cfg.driftYRange,
          duration: cfg.driftSpeed * 0.73,
          useNativeDriver: true,
        }),
      ]),
    );

    // Gentle rotation oscillation
    const rotAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(rot, {
          toValue: cfg.rotateDeg,
          duration: cfg.driftSpeed * 1.1,
          useNativeDriver: true,
        }),
        Animated.timing(rot, {
          toValue: -cfg.rotateDeg,
          duration: cfg.driftSpeed * 1.1,
          useNativeDriver: true,
        }),
      ]),
    );

    // Jump to a staggered starting position so all floaties aren't in sync
    driftX.setValue(seededFloat(cfg.phaseOffset * 999, -cfg.driftXRange, cfg.driftXRange));
    driftY.setValue(seededFloat(cfg.phaseOffset * 777, -cfg.driftYRange, cfg.driftYRange));
    rot.setValue(seededFloat(cfg.phaseOffset * 555, -cfg.rotateDeg, cfg.rotateDeg));

    xAnim.start();
    yAnim.start();
    rotAnim.start();

    return () => {
      xAnim.stop();
      yAnim.stop();
      rotAnim.stop();
    };
  }, []);

  const rotate = rot.interpolate({
    inputRange: [-cfg.rotateDeg, cfg.rotateDeg],
    outputRange: [`-${cfg.rotateDeg}deg`, `${cfg.rotateDeg}deg`],
  });

  return (
    <Animated.Image
      source={cfg.src}
      style={[
        styles.sticker,
        {
          left: cfg.baseX,
          top: cfg.baseY,
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.borderRadius,
          opacity: Animated.multiply(fade, cfg.opacity) as unknown as number,
          transform: [{ translateX: driftX }, { translateY: driftY }, { rotate }],
        },
      ]}
      resizeMode="cover"
    />
  );
}

// ─── Container ───────────────────────────────────────────────────────────────
export function FloatingImages() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {FLOATIES.map((cfg, i) => (
        <Floatie key={i} cfg={cfg} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sticker: {
    position: 'absolute',
  },
});
