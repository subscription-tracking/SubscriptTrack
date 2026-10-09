import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../design/tokens';

/**
 * Flutter `AmbientBackground` karşılığı: radyal yıkama ve iki yumuşak vurgu lekesi.
 * Flutter'daki `ImageFilter.blur(22)` RN'de yerine lekenin radyal geçişi
 * kullanılarak yaklaşıklanır; kenarlar aynı yumuşaklıkta görünür.
 */

const BLOB_LEFT = { size: 200, opacity: 0.12 };
const BLOB_RIGHT = { size: 220, opacity: 0.16 };

export function AmbientBackground({ children, accent = colors.primary }: { children: ReactNode; accent?: string }) {
  const { width, height } = useWindowDimensions();
  const shortest = Math.min(width, height);
  // Flutter RadialGradient(center: (0, -0.6), radius: 1.1): merkez yüzdesi ve yarıçap en kısa kenara göre.
  const washCx = 0.5;
  const washCy = (-0.6 + 1) / 2;
  const washR = 1.1;

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
        <Defs>
          <RadialGradient
            id="wash"
            cx={width * washCx}
            cy={height * washCy}
            r={washR * shortest}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={colors.ambientWash} />
            <Stop offset="1" stopColor={colors.surface} />
          </RadialGradient>
          <RadialGradient id="blobRight" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0.3" stopColor={accent} stopOpacity={BLOB_RIGHT.opacity} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blobLeft" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0.3" stopColor={accent} stopOpacity={BLOB_LEFT.opacity} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#wash)" />
        <Circle
          cx={width + 90 - BLOB_RIGHT.size / 2}
          cy={-120 + BLOB_RIGHT.size / 2}
          r={BLOB_RIGHT.size / 2}
          fill="url(#blobRight)"
        />
        <Circle
          cx={-100 + BLOB_LEFT.size / 2}
          cy={height + 90 - BLOB_LEFT.size / 2}
          r={BLOB_LEFT.size / 2}
          fill="url(#blobLeft)"
        />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
