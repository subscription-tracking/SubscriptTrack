import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, extraRadius, extraSpacing, sizes, spacing, withAlpha } from '../design/tokens';
import { textStyle } from '../design/typography';
import { HeaderShell } from './HeaderShell';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Flutter `TopBar` karşılığı: her sekmede aynı yükseklik (88), ikon kutusu, isteğe bağlı alt başlık ve
 * başlık; sağda takvim ve okunmamış rozetli bildirim düğmesi. Yüksekliğe güvenli alan üstü eklenir.
 */
export function TopBar({
  icon,
  title,
  subtitle,
  unreadCount = 0,
  onCalendar,
  onNotifications,
}: {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  unreadCount?: number;
  onCalendar: () => void;
  onNotifications: () => void;
}) {
  useThemeRevision();
  return (
    <HeaderShell minHeight={sizes.topBarHeight}>
      <View style={styles.titleRow}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={sizes.topBarIconSize} color={colors.primary} />
        </View>
        <View style={styles.titleColumn}>
          {subtitle ? <Text numberOfLines={1} style={textStyle('caption')}>{subtitle}</Text> : null}
          <Text numberOfLines={1} style={[textStyle('heading'), subtitle ? styles.subtitleGap : null]}>
            {title}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <IconButton icon="calendar-outline" label="Takvim" onPress={onCalendar} />
        <View>
          <IconButton
            icon="notifications-outline"
            label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
            onPress={onNotifications}
          />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={textStyle('caption', { color: colors.white })}>{String(unreadCount)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.trailingGap} />
      </View>
    </HeaderShell>
  );
}

function IconButton({ icon, label, onPress }: { icon: IoniconName; label: string; onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <Ionicons name={icon} size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: sizes.topBarIconBox,
    height: sizes.topBarIconBox,
    borderRadius: extraRadius.topBarIcon,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.16),
  },
  titleColumn: {
    flex: 1,
    marginLeft: extraSpacing.topBarIconGap,
    justifyContent: 'center',
  },
  subtitleGap: {
    marginTop: extraSpacing.topBarSubtitleGap,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.xxs,
    right: spacing.xxs,
    minWidth: sizes.badgeSize,
    height: sizes.badgeSize,
    borderRadius: sizes.badgeSize / 2,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
  trailingGap: {
    width: spacing.xs,
  },
}));
