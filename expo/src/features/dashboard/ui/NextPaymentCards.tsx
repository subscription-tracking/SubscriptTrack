import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';

/** Yenileme bölümünün altında tek satır: hatırlatma ayarlarına kısayol (kartlarda tekrarlanmaz). */
export function ReminderHint({ onPress }: { onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Hatırlatma ayarları" onPress={onPress} style={styles.hint}>
      <Ionicons name="notifications-outline" size={sizes.hintIcon} color={colors.primary} />
      <Text style={textStyle('caption', { flex: 1, marginLeft: gaps.hint })}>Yenileme öncesi hatırlatmayı ayarlardan yönetebilirsin</Text>
      <Text style={textStyle('captionStrong', { color: colors.primary })}>Ayarlar</Text>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: gaps.cardInset - 4,
    paddingHorizontal: gaps.cardInset - 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.chip,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: withAlpha(colors.surfaceContainerHighest, 0.5),
  },
}));
