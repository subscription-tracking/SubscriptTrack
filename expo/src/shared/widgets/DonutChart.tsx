import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/** Flutter `DashboardDonutPainter` boşluğu: her dilim arasında tur cinsinden 0.02. */
const SLICE_GAP = 0.02;
/** Çok küçük dilimler de görünsün diye en az bu kadar tur (≈%4) çizilir. */
const MIN_SLICE_TURN = 0.04;

export interface DonutSlice {
  /** Toplamın oranı (0–1). */
  fraction: number;
  color: string;
}

/**
 * Flutter `_DonutChart` / `DashboardDonutPainter`: 112 px kutuda iz çemberi ve dilimler; kalınlık %13.
 * Dilimler saat 12'den saat yönünde, her dilim `fraction - SLICE_GAP` kadar yay çizer.
 */
export function DonutChart({
  size = 112,
  slices,
  trackColor,
  children,
  accessibilityLabel,
}: {
  size?: number;
  slices: DonutSlice[];
  trackColor: string;
  children?: ReactNode;
  /** Ekran okuyucu özeti (ör. "3 grup, toplam 1.200 ₺, en büyük Eğlence %60"). */
  accessibilityLabel?: string;
}) {
  useThemeRevision();
  const stroke = size * 0.13;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Tek dilimde boşluk yok: halka tam kapanır. Birden çok dilimde dilimler arası boşluk bırakılır.
  const gap = slices.length > 1 ? SLICE_GAP : 0;
  const arcs = slices.map((slice, index) => {
    const start = slices.slice(0, index).reduce((sum, prior) => sum + prior.fraction, 0);
    const turn = slice.fraction > 0 ? Math.min(1, Math.max(MIN_SLICE_TURN, slice.fraction - gap)) : 0;
    return { ...slice, length: turn * circumference, offset: -start * circumference };
  });

  return (
    <View style={[styles.box, { width: size, height: size }]} accessible={accessibilityLabel !== undefined} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        {arcs.map((arc, index) =>
          arc.fraction > 0 ? (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              stroke={arc.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={[arc.length, circumference]}
              strokeDashoffset={arc.offset}
              fill="none"
              transform={`rotate(-90 ${center} ${center})`}
            />
          ) : null,
        )}
      </Svg>
      {children}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
