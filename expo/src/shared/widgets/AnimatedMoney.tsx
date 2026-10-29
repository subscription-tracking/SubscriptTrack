import { useThemeRevision } from '../design/useThemeRevision';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Text, type TextStyle } from 'react-native';

import { formatAmount } from '../../core/format/money';

/**
 * Flutter `AppAnimatedMoney`: tutar 0'dan hedefe 900 ms'de yumuşakça (easeOutCubic) sayılır.
 * Biçim `formatAmount` ile aynıdır.
 */
export function AnimatedMoney({
  amount,
  currency,
  style,
  duration = 900,
  fit = false,
}: {
  amount: number;
  currency: string;
  style?: TextStyle;
  duration?: number;
  /** Büyük tutarlarda tek satıra sığacak şekilde yazıyı küçültür. */
  fit?: boolean;
}) {
  useThemeRevision();
  const value = useCountUp(amount, duration);
  return (
    <Text style={style} numberOfLines={fit ? 1 : undefined} adjustsFontSizeToFit={fit} minimumFontScale={fit ? 0.6 : undefined}>
      {formatAmount(value, currency)}
    </Text>
  );
}

/** Hedef değere easeOutCubic ile ulaşan sayı. Her hedef değişiminde 0'dan yeniden sayar. */
export function useCountUp(target: number, duration: number): number {
  const [value, setValue] = useState(target);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => { changed = true; setReduceMotion(enabled); });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted && !changed) setReduceMotion(enabled);
    }).catch(() => undefined);
    return () => { mounted = false; listener.remove(); };
  }, []);
  useEffect(() => {
    if (reduceMotion || duration <= 0) return;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const step = () => {
      const t = Math.min(1, (Date.now() - started) / duration);
      setValue(target * (1 - (1 - t) ** 3));
      if (t < 1) timer = setTimeout(step, 16);
    };
    step();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [target, duration, reduceMotion]);
  return reduceMotion || duration <= 0 ? target : value;
}
