import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/**
 * Grafik öğelerinin ilk girişi: her öğe 0'dan 1'e büyür, öğeler sırayla (stagger) başlar. Yalnızca ilk
 * mount'ta oynar; öğe sayısı değişirse yeni öğeler hemen 1 olur (veri değişince tekrar oynamaz). Sistem
 * hareket azaltma açıksa hiç oynatılmaz. Değerler `interpolate` ile yükseklik ya da genişliğe bağlanır.
 */
export function useGrowIn(count: number, duration = 400, stagger = 40): Animated.Value[] {
  const [initialCount] = useState(count);
  const values = useMemo(
    () => Array.from({ length: count }, () => new Animated.Value(count === initialCount ? 0 : 1)),
    [count, initialCount],
  );

  useEffect(() => {
    const items = values;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        items.forEach((value) => value.setValue(1));
        return;
      }
      Animated.stagger(
        stagger,
        items.map((value) =>
          Animated.timing(value, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ),
      ).start();
    });
    return () => {
      cancelled = true;
    };
  }, [values, duration, stagger]);

  return values;
}
