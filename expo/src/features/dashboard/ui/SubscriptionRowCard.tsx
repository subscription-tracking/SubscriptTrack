import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { ServiceIdentity } from '../../subscriptions/ui/ServiceIdentity';

/**
 * Ana sayfa satır kartı: servis logosu, ad, alt metin ve sağda içerik (tutar ya da düğme). Dokunulabilir alan
 * yalnız sol bölümdür; sağdaki düğme iç içe düğme olmadan kendi başına odaklanır.
 */
export function SubscriptionRowCard({
  subscription,
  subtitle,
  subtitleColor = colors.onSurfaceVariant,
  trailing,
  onPress,
}: {
  subscription: Subscription;
  subtitle: string;
  subtitleColor?: string;
  trailing: ReactNode;
  onPress: () => void;
}) {
  useThemeRevision();
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${subscription.name}, ${subtitle}`}
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <ServiceIdentity name={subscription.name} category={subscription.category} size={sizes.archiveAvatar} />
        <View style={styles.middle}>
          <Text style={textStyle('bodyStrong')} numberOfLines={1}>{subscription.name}</Text>
          <Text style={textStyle('caption', { color: subtitleColor, marginTop: spacing.xxs / 2 })} numberOfLines={2}>{subtitle}</Text>
        </View>
      </Pressable>
      {trailing}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: gaps.sheetRow,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.85 },
  middle: { flex: 1, marginHorizontal: gaps.sheetRow },
}));
