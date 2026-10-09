import { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatLongDate } from '../../../core/format/date';
import { civilDate } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { type CenterNotification } from '../data/notificationRepository';
import { notificationText, type NotificationKind } from '../domain/notificationCenter';

/** Flutter `NotificationType.icon`: tür başına renk noktası (emoji). */
const KIND_ICON: Record<NotificationKind, string> = {
  renewal_today: '🔴',
  renewal_soon: '🟡',
  renewal_upcoming: '🔵',
  trial_today: '🟣',
  trial_soon: '🟣',
  trial_upcoming: '🟣',
};

/** Okunmamış avatar zemini (Flutter `_avatarColor`): bugün kırmızımsı, yakında sarımsı, diğerleri birincil. */
function avatarColor(kind: NotificationKind, read: boolean): string {
  if (read) return colors.surfaceContainerHighest;
  if (kind === 'renewal_today') return colors.errorContainer;
  if (kind === 'renewal_soon') return colors.tertiaryContainer;
  return colors.primaryContainer;
}

/** Sola kaydırma eşiği (px). Bu değerin altında bırakılan satır geri döner. */
const DISMISS_THRESHOLD = 120;

/**
 * Bildirim satırı (Flutter `_NotificationTile`): avatar, başlık, metin ve tarih; okunmamışsa nokta. Sola kaydırıp
 * bırakınca satır kapanır (Flutter `Dismissible`). Dokunma okundu işaretler ve abonelik ayrıntısına gider.
 */
export function NotificationRow({
  item,
  read,
  onOpen,
  onDismiss,
}: {
  item: CenterNotification;
  read: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const text = notificationText(item.kind, { name: item.name, days: item.days });
  const created = new Date(item.createdAt);

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dx < -8 && Math.abs(gesture.dy) < 12,
      onPanResponderMove: (_, gesture) => translateX.setValue(Math.min(0, gesture.dx)),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -DISMISS_THRESHOLD) {
          Animated.timing(translateX, { toValue: -sizes.rowExit, duration: 180, useNativeDriver: true }).start(onDismiss);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.background}>
        <MaterialIcons name="delete-outline" size={sizes.iconButtonSize} color={colors.onErrorContainer} />
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...responder.panHandlers}>
        <Pressable accessibilityRole="button" onPress={onOpen} style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: avatarColor(item.kind, read) }]}>
            <Text style={styles.emoji}>{KIND_ICON[item.kind]}</Text>
          </View>
          <View style={styles.texts}>
            <Text style={textStyle(read ? 'body' : 'bodyLargeStrong', { color: read ? colors.onSurfaceVariant : colors.onSurface })}>
              {text.title}
            </Text>
            <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{text.body}</Text>
            <Text style={textStyle('caption')}>
              {formatLongDate(civilDate(created.getFullYear(), created.getMonth() + 1, created.getDate()))}
            </Text>
          </View>
          {read ? null : <View style={styles.unreadDot} />}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFill,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: gaps.cardInset + spacing.xxs,
    backgroundColor: colors.errorContainer,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: sizes.notificationAvatar,
    height: sizes.notificationAvatar,
    borderRadius: sizes.notificationAvatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: sizes.notificationEmoji,
  },
  texts: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.xs,
  },
  unreadDot: {
    width: sizes.unreadDot,
    height: sizes.unreadDot,
    borderRadius: sizes.unreadDot / 2,
    backgroundColor: colors.primary,
  },
});
