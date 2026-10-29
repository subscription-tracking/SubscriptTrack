import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, extraSpacing, sizes, spacing } from '../design/tokens';
import { textStyle } from '../design/typography';
import { HeaderShell } from './HeaderShell';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Flutter `TopBar` karşılığı: her sekmede aynı yükseklik (88), ikon kutusu, isteğe bağlı alt başlık ve
 * başlık; sağda takvim ve okunmamış rozetli bildirim düğmesi. Yüksekliğe güvenli alan üstü eklenir.
 */
export function TopBar({
  title,
  subtitle,
  unreadCount = 0,
  onCalendar,
  onNotifications,
  variant = 'default',
  showCalendar = false,
}: {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  unreadCount?: number;
  onCalendar: () => void;
  onNotifications: () => void;
  variant?: 'default' | 'home';
  showCalendar?: boolean;
}) {
  useThemeRevision();
  return (
    <HeaderShell minHeight={sizes.topBarHeight}>
      <View style={styles.titleRow}>
        <View style={styles.titleColumn}>
          {variant === 'home' ? <>
            <Text accessibilityRole="header" style={textStyle('headline')}><Text>Subscript</Text><Text style={{ color: colors.primary }}>Track</Text></Text>
            {subtitle ? <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{subtitle}</Text> : null}
          </> : <>
            <Text accessibilityRole="header" style={textStyle('headline')}>{title}</Text>
            <Text
              accessibilityElementsHidden={!subtitle}
              importantForAccessibility={subtitle ? 'auto' : 'no-hide-descendants'}
              style={[textStyle('bodySmall', { color: colors.onSurfaceVariant }), styles.subtitleGap, !subtitle && styles.reservedSubtitle]}
            >
              {subtitle ?? '\u00a0'}
            </Text>
          </>}
        </View>
      </View>
      <View style={styles.actions}>
        {showCalendar ? <IconButton icon="calendar-outline" label="Takvim" onPress={onCalendar} /> : null}
        {variant === 'home' ? <View>
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
        </View> : null}
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
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitleGap: {
    marginTop: extraSpacing.topBarSubtitleGap,
  },
  reservedSubtitle: { opacity: 0 },
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
