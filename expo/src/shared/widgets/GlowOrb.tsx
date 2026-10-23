import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, sizes, withAlpha } from '../design/tokens';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Flutter `GlowOrb`: tonlu daire, ince kenarlık ve yumuşak gölge halesi.
 * Simge çapın %46'sı kadardır (Flutter ile aynı oran).
 */
export function GlowOrb({
  icon,
  color = colors.primary,
  size = sizes.glowOrbSize,
}: {
  icon: MaterialIconName;
  color?: string;
  size?: number;
}) {
  useThemeRevision();
  return (
    <View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: withAlpha(color, 0.1),
          borderColor: withAlpha(color, 0.28),
          shadowColor: color,
        },
      ]}
    >
      <MaterialIcons name={icon} size={size * 0.46} color={color} />
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    // iOS gölge halesi; Flutter blurRadius 48 ≈ shadowRadius 24, spreadRadius 4 yaklaşık.
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
}));
