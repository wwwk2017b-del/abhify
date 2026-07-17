/**
 * Butterflies — light purple SVG butterflies that orbit the screen
 * using react-native-reanimated v4 for smooth 60fps native animation.
 */
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Path, Ellipse } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const CX = SW / 2;
const CY = SH / 2;

// ── Butterfly SVG shape ────────────────────────────────────────────────────────
// Simple two-winged butterfly centered at 0,0; fits in a ~40×28 box.
function ButterflyShape({ size, color }: { size: number; color: string }) {
  const s = size / 40; // scale factor
  return (
    <Svg width={size * 2} height={size * 1.4} viewBox="-40 -28 80 56">
      {/* Left upper wing */}
      <Path
        d="M-2,-2 C-8,-18 -30,-22 -28,-8 C-26,2 -10,4 -2,-2 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Right upper wing */}
      <Path
        d="M2,-2 C8,-18 30,-22 28,-8 C26,2 10,4 2,-2 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Left lower wing */}
      <Path
        d="M-2,2 C-6,10 -22,16 -20,8 C-18,2 -8,0 -2,2 Z"
        fill={color}
        opacity={0.7}
      />
      {/* Right lower wing */}
      <Path
        d="M2,2 C6,10 22,16 20,8 C18,2 8,0 2,2 Z"
        fill={color}
        opacity={0.7}
      />
      {/* Body */}
      <Ellipse cx={0} cy={0} rx={2.2} ry={7} fill={color} opacity={0.9} />
    </Svg>
  );
}

// ── Deterministic seeded float (no Math.random so positions are stable) ────────
function sf(seed: number, lo: number, hi: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return lo + (x - Math.floor(x)) * (hi - lo);
}

// ── Config per butterfly ───────────────────────────────────────────────────────
interface BfConfig {
  orbitRx: number;   // horizontal radius of orbit ellipse
  orbitRy: number;   // vertical radius of orbit ellipse
  orbitCx: number;   // orbit centre x (absolute screen coords)
  orbitCy: number;   // orbit centre y (absolute screen coords)
  startAngle: number;// starting angle in radians
  speed: number;     // ms per full orbit
  size: number;      // butterfly size
  opacity: number;
  flapSpeed: number; // ms per wing-flap cycle
  bobAmp: number;    // extra vertical bob amplitude
  bobSpeed: number;  // ms per bob cycle
}

function buildConfigs(n: number): BfConfig[] {
  return Array.from({ length: n }, (_, i) => {
    const s = i + 1;
    return {
      orbitRx: sf(s * 3, 60, CX * 0.85),
      orbitRy: sf(s * 7, 40, CY * 0.6),
      orbitCx: sf(s * 11, CX * 0.3, CX * 1.7),
      orbitCy: sf(s * 13, CY * 0.25, CY * 1.1),
      startAngle: sf(s * 17, 0, Math.PI * 2),
      speed: sf(s * 19, 9000, 22000),
      size: sf(s * 23, 14, 24),
      opacity: sf(s * 29, 0.22, 0.48),
      flapSpeed: sf(s * 31, 320, 700),
      bobAmp: sf(s * 37, 6, 18),
      bobSpeed: sf(s * 41, 1800, 3800),
    };
  });
}

const CONFIGS = buildConfigs(12);

// ── Single animated butterfly ──────────────────────────────────────────────────
function Butterfly({ cfg }: { cfg: BfConfig }) {
  // Orbit angle: 0 → 2π looping
  const angle = useSharedValue(cfg.startAngle);

  // Wing flap: scaleX oscillates 0.25 → 1 → 0.25
  const flapX = useSharedValue(1);

  // Extra bob: translateY oscillates
  const bob = useSharedValue(0);

  // Fade in
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    // Fade in
    fadeIn.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });

    // Orbit
    const fullCircle = Math.PI * 2;
    angle.value = withRepeat(
      withTiming(cfg.startAngle + fullCircle, {
        duration: cfg.speed,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    // Wing flap
    flapX.value = withRepeat(
      withSequence(
        withTiming(0.22, { duration: cfg.flapSpeed / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: cfg.flapSpeed / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    // Bob
    bob.value = withRepeat(
      withSequence(
        withTiming(cfg.bobAmp, { duration: cfg.bobSpeed / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(-cfg.bobAmp, { duration: cfg.bobSpeed / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const outerStyle = useAnimatedStyle(() => {
    const a = angle.value;
    const x = cfg.orbitCx + Math.cos(a) * cfg.orbitRx;
    const y = cfg.orbitCy + Math.sin(a) * cfg.orbitRy + bob.value;
    // Rotate butterfly to face direction of travel (tangent angle)
    const tangentDeg = (a * 180) / Math.PI + 90;
    return {
      transform: [
        { translateX: x - cfg.size },
        { translateY: y - cfg.size * 0.7 },
        { rotate: `${tangentDeg}deg` },
      ],
      opacity: fadeIn.value * cfg.opacity,
    };
  });

  const flapStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: flapX.value }],
  }));

  return (
    <Animated.View style={[styles.butterfly, outerStyle]}>
      <Animated.View style={flapStyle}>
        <ButterflyShape size={cfg.size} color="#D8B4FE" />
      </Animated.View>
    </Animated.View>
  );
}

// ── Container ──────────────────────────────────────────────────────────────────
export function Butterflies() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {CONFIGS.map((cfg, i) => (
        <Butterfly key={i} cfg={cfg} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  butterfly: {
    position: 'absolute',
  },
});
