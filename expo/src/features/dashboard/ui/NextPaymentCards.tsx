import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

/** Flutter `DashboardEmptyIntro`: hiç abonelik yokken açıklama kutusu. */
export function EmptyIntro() {
  useThemeRevision();
  return (
    <View style={styles.intro}>
      <Text style={textStyle('bodyStrong')}>Ana sayfanı oluşturmaya başla</Text>
      <Text style={[textStyle('bodySmall'), styles.introBody]}>
        Aboneliklerini ekle; aylık giderlerini, yenileme tarihlerini ve ücretsiz denemelerini tek yerde takip et.
      </Text>
    </View>
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
  intro: {
    padding: gaps.cardInset + spacing.xxs - 4,
    borderRadius: radius.intro,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  introBody: {
    marginTop: spacing.xxs,
  },
}));
