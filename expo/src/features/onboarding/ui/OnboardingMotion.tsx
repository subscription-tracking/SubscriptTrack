import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, View } from 'react-native';

/**
 * Tanıtım hareketleri (Flutter `onboarding_motion.dart`). Sallanma (bob) genliği 6 px ve periyodu 2600 ms;
 * `phase` başlangıç gecikmesi olarak uygulanır, böylece rozetler birbirinden ayrışır.
 */

const BOB_AMPLITUDE = 6;
const BOB_PERIOD = 2600;

/** Sürekli yukarı-aşağı hareket eden sarmalayıcı. */
export function Bob({ children, phase = 0 }: { children: ReactNode; phase?: number }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const half = BOB_PERIOD / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    // Faz farkı: fazı gecikme olarak uygularız (sin dalgası için yaklaşık).
    const delay = Math.round(((phase % (2 * Math.PI)) / (2 * Math.PI)) * BOB_PERIOD);
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [phase, value]);

  const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [BOB_AMPLITUDE, -BOB_AMPLITUDE] });
  return <Animated.View style={{ transform: [{ translateY }] }}>{children}</Animated.View>;
}

/** Nabız: ölçek 1 → 1.18 ve geri, 1100 ms yarım döngü (Flutter `CalendarIllustration`). */
export function usePulse(): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value;
}

/** Tek seferlik ilerleme: 150 ms gecikme, 1100 ms, easeOutCubic (Flutter `AnalyticsIllustration`). */
export function useSweep(): { value: Animated.Value; progress: number } {
  const value = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = value.addListener(({ value: next }) => setProgress(next));
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 1100,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      value.removeListener(id);
      animation.stop();
    };
  }, [value]);
  return { value, progress };
}

/** Tanıtım sayfasının kendi içeriği; sayfa ortalanır. */
export function Centered({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}
