import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { colors, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { HeaderShell } from '../../../shared/widgets/HeaderShell';

/**
 * Bildirim merkezi üst çubuğu: geri, başlık ve iki etiketli ikon düğmesi (tümünü okundu say, bildirim ayarları).
 * "Tümünü okundu say" yalnızca okunmamış bildirim varken etkindir.
 */
export function NotificationCenterHeader({ canMarkAll, onMarkAll }: { canMarkAll: boolean; onMarkAll: () => void }) {
  useThemeRevision();
  const router = useRouter();
  return (
    <HeaderShell style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={[styles.button, styles.back]}>
        <MaterialIcons name="arrow-back" size={sizes.iconButtonSize} color={colors.onBackground} />
      </Pressable>
      <Text accessibilityRole="header" style={[textStyle('heading'), styles.title]}>Bildirimler</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tümünü okundu say"
        accessibilityState={{ disabled: !canMarkAll }}
        disabled={!canMarkAll}
        onPress={onMarkAll}
        style={styles.button}
      >
        <MaterialIcons name="done-all" size={sizes.iconButtonSize} color={canMarkAll ? colors.onBackground : colors.disabledText} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bildirim ayarları"
        onPress={() => router.push('/settings/notifications')}
        style={styles.button}
      >
        <MaterialIcons name="settings" size={sizes.iconButtonSize} color={colors.onBackground} />
      </Pressable>
    </HeaderShell>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  bar: {
    gap: spacing.xs,
  },
  title: {
    flex: 1,
  },
  button: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    // Glif ekran kenar boşluğuna oturur (ScreenTopBar ile aynı).
    marginLeft: -spacing.sm,
  },
}));
