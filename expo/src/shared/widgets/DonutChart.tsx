import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/** Flutter `DashboardDonutPainter` boşluğu: her dilim arasında tur cinsinden 0.02. */
const SLICE_GAP = 0.02;

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
}: {
  size?: number;
  slices: DonutSlice[];
  trackColor: string;
  children?: ReactNode;
}) {
  const stroke = size * 0.13;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulative = 0;
  const arcs = slices.map((slice) => {
    const start = cumulative;
    cumulative += slice.fraction;
    const length = Math.max(0, Math.min(1, slice.fraction - SLICE_GAP)) * circumference;
    return { ...slice, length, offset: -start * circumference };
  });

  return (
    <View style={[styles.box, { width: size, height: size }]}>
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
              strokeLinecap="round"
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

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
