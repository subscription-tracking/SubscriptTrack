import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Flutter `SettingsSectionLabel`: 13 px, w600, bölüm başlığı (ekran okuyucuda başlık). */
export function SectionLabel({ label }: { label: string }) {
  useThemeRevision();
  return (
    <Text accessibilityRole="header" style={[textStyle('label', { color: colors.onSurfaceVariant }), styles.sectionLabel]}>
      {label}
    </Text>
  );
}

/** Flutter `SettingsTile`: ikon, etiket, sağda değer ve chevron; en az 48 px, alt kenarda ince çizgi. */
export function SettingsTile({
  icon,
  label,
  value,
  onPress,
}: {
  icon: MaterialIconName;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  useThemeRevision();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
    >
      <MaterialIcons name={icon} size={sizes.tileIcon} color={colors.onSurface} />
      <Text style={[textStyle('label'), styles.tileLabel]} numberOfLines={2}>
        {label}
      </Text>
      {value ? (
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'right', flexShrink: 1, maxWidth: '45%' })} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
      ) : null}
      <MaterialIcons name="chevron-right" size={sizes.tileIcon} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

/** Flutter `AccountSummaryCard`: baş harf avatarı, "Hesap bilgileri", ad ve e-posta. Dokununca profil açılır. */
export function AccountSummaryCard({
  initials,
  name,
  email,
  onPress,
}: {
  initials: string;
  name: string;
  email: string;
  onPress: () => void;
}) {
  useThemeRevision();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Hesap bilgileri, ${name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.account, pressed ? styles.pressed : null]}
    >
      <View style={styles.avatar}>
        <Text style={textStyle('heading', { color: colors.primary })}>{initials}</Text>
      </View>
      <View style={styles.accountText}>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Hesap bilgileri</Text>
        <Text style={textStyle('bodyStrong', { marginTop: spacing.xxs / 2 })} numberOfLines={1}>
          {name}
        </Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })} numberOfLines={1}>
          {email}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={sizes.tileIcon} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

/** Flutter `SignOutButton`: hata renginde kenarlıklı, 12 köşeli düğme; ikon ve kalın yazı. */
export function SignOutButton({ onPress }: { onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.signOut, pressed ? styles.pressed : null]}>
      <MaterialIcons name="logout" size={sizes.signOutIcon} color={colors.error} />
      <Text style={[textStyle('label', { color: colors.error }), styles.signOutLabel]}>Çıkış yap</Text>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  sectionLabel: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxs,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: gaps.rowLoose - 2 + spacing.xxs / 2,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.outlineHalf,
  },
  tileLabel: {
    flex: 1,
    marginLeft: gaps.rowLoose - 2,
    marginRight: spacing.xs,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.statsEdge,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  avatar: {
    width: sizes.accountAvatar,
    height: sizes.accountAvatar,
    borderRadius: sizes.accountAvatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.16),
  },
  accountText: {
    flex: 1,
    marginLeft: gaps.rowLoose,
    marginRight: spacing.xs,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    paddingVertical: gaps.rowLoose - 2 + spacing.xxs / 2,
    borderRadius: radius.field,
    borderWidth: borderWidth.hairline + 0.5,
    borderColor: colors.error,
  },
  signOutLabel: {
    marginLeft: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
}));
