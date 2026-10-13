import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textButtonText, textStyle } from '../../../shared/design/typography';

/**
 * Flutter `EmptyDayState`: gün seçilmediyse "Bir gün seç", seçili günde yenileme yoksa "Bu gün yenileme yok".
 * Seçili günde ekleme bağlantısı, o tarihte başlayan yeni abonelik formunu açar.
 */
export function EmptyDayState({ hasSelection, onAddForDay }: { hasSelection: boolean; onAddForDay?: () => void }) {
  useThemeRevision();
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>
        <MaterialIcons
          name={hasSelection ? 'calendar-today' : 'touch-app'}
          size={sizes.emptyDayIcon}
          color={colors.onSurfaceVariant}
        />
      </View>
      <Text style={textStyle('label', { color: colors.onSurfaceVariant, marginTop: gaps.rowLoose - 2 })}>
        {hasSelection ? 'Bu gün yenileme yok' : 'Bir gün seç'}
      </Text>
      {onAddForDay ? (
        <Pressable accessibilityRole="button" onPress={onAddForDay} style={styles.link}>
          <MaterialIcons name="add" size={sizes.linkIcon} color={colors.primary} />
          <Text style={[textButtonText, { marginLeft: spacing.xs }]}>Bu tarihte başlayan abonelik ekle</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  circle: {
    width: sizes.emptyDayCircle,
    height: sizes.emptyDayCircle,
    borderRadius: sizes.emptyDayCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.hairline,
    borderColor: withAlpha(colors.primary, 0.18),
    backgroundColor: withAlpha(colors.primary, 0.08),
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    marginTop: gaps.rowLoose - 2,
    paddingHorizontal: gaps.sectionInner,
  },
}));
