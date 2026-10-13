import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { type ComponentProps, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, sizes, spacing, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { TextLink } from '../../../shared/widgets/TextLink';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { type SubscriptionCategory } from '../../subscriptions/domain/subscription';
import { ServiceIdentity } from '../../subscriptions/ui/ServiceIdentity';
import { type CenterNotification } from '../data/notificationRepository';
import { notificationText, type NotificationKind } from '../domain/notificationCenter';
import { type RowActions } from './notificationGroups';

/** Tür başına ikon: abonelik bulunamazsa logo yerine görünür; aciliyet rengi `kindTone` ile verilir. */
const KIND_ICON: Record<NotificationKind, MaterialIconName> = {
  renewal_today: 'autorenew',
  renewal_soon: 'autorenew',
  renewal_upcoming: 'autorenew',
  trial_today: 'hourglass-bottom',
  trial_soon: 'hourglass-bottom',
  trial_upcoming: 'hourglass-bottom',
};

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** İkon rengi: bugün hata, yakında uyarı, diğerleri birincil; deneme türleri deneme rengi. */
function kindTone(kind: NotificationKind): string {
  if (kind === 'renewal_today') return colors.error;
  if (kind === 'renewal_soon') return statusColors.warning;
  if (kind.startsWith('trial')) return statusColors.trial;
  return colors.primary;
}

/** Yedek avatar zemini: okunmuşsa nötr, bugün kırmızımsı, yakında sarımsı, diğerleri birincil. */
function avatarColor(kind: NotificationKind, read: boolean): string {
  if (read) return colors.surfaceContainerHighest;
  if (kind === 'renewal_today') return colors.errorContainer;
  if (kind === 'renewal_soon') return colors.tertiaryContainer;
  return colors.primaryContainer;
}

/** Sola kaydırma eşiği (px). Bu değerin altında bırakılan satır geri döner. */
const DISMISS_THRESHOLD = 120;

/**
 * Bildirim satırı: önde servis logosu, başlık (abonelik adı), gövde ve tutar; sağ üstte okunmamış noktası ve
 * tekrar sayısı. Vadesi gelmiş abonelikte altta "Ödendi" ve "Aboneliği aç" eylemleri çıkar. Sola kaydırma ya da
 * erişilebilirlik eylemi satırı kapatır; dokunma okundu işaretler ve ayrıntıyı açar.
 */
export function NotificationRow({
  item,
  read,
  count = 1,
  identity,
  amountText,
  actions = null,
  paying = false,
  onOpen,
  onDismiss,
  onMarkRead,
  onPay,
}: {
  item: CenterNotification;
  read: boolean;
  /** Aynı bildirimin tekrar sayısı; 1'den büyükse "×N" rozeti çıkar. */
  count?: number;
  /** Abonelik bulunduysa logo için ad ve kategori; yoksa tür ikonu görünür. */
  identity?: { name: string; category: SubscriptionCategory };
  amountText?: string;
  /** Eylem satırı; `null` ise hiç çıkmaz. */
  actions?: RowActions | null;
  paying?: boolean;
  onOpen: () => void;
  onDismiss: () => void;
  onMarkRead: () => void;
  onPay?: () => void;
}) {
  useThemeRevision();
  const [translateX] = useState(() => new Animated.Value(0));
  const text = notificationText(item.kind, { name: item.name, days: item.days });
  const detail = amountText ? `${text.body} · ${amountText}` : text.body;
  const label = [text.title, text.body, amountText, count > 1 ? `${count} kez` : null, read ? null : 'okunmamış'].filter(Boolean).join(', ');
  const accessibilityActions = [
    { name: 'dismiss', label: 'Kapat' },
    ...(read ? [] : [{ name: 'markRead', label: 'Okundu say' }]),
  ];

  const [responder] = useState(() =>
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
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.background}>
        <MaterialIcons name="delete-outline" size={sizes.iconButtonSize} color={colors.onErrorContainer} />
      </View>
      <Animated.View style={[styles.row, { transform: [{ translateX }] }]} {...responder.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={item.subscriptionId ? 'Okundu işaretler ve abonelik ayrıntılarını açar.' : 'Okundu işaretler.'}
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={({ nativeEvent }) => {
            if (nativeEvent.actionName === 'dismiss') onDismiss();
            if (nativeEvent.actionName === 'markRead') onMarkRead();
          }}
          onPress={onOpen}
          style={styles.main}
        >
          {identity ? (
            <ServiceIdentity name={identity.name} category={identity.category} size={sizes.notificationAvatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor(item.kind, read) }]}>
              <MaterialIcons name={KIND_ICON[item.kind]} size={sizes.iconButtonSize} color={kindTone(item.kind)} />
            </View>
          )}
          <View style={styles.texts}>
            <Text style={textStyle(read ? 'body' : 'bodyStrong', { color: read ? colors.onSurfaceVariant : colors.onSurface })}>
              {text.title}
            </Text>
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{detail}</Text>
          </View>
          <View style={styles.badges}>
            {count > 1 ? <Text style={textStyle('captionStrong', { color: colors.onSurfaceVariant })}>{`×${count}`}</Text> : null}
            {read ? null : <View style={styles.unreadDot} />}
          </View>
        </Pressable>
        {actions ? (
          <View style={styles.actions}>
            {actions.canPay ? <TonalButton label="Ödendi" disabled={paying} onPress={() => onPay?.()} /> : null}
            <TextLink label="Aboneliği aç" onPress={onOpen} />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
  },
  avatar: {
    width: sizes.notificationAvatar,
    height: sizes.notificationAvatar,
    borderRadius: sizes.notificationAvatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  unreadDot: {
    width: sizes.unreadDot,
    height: sizes.unreadDot,
    borderRadius: sizes.unreadDot / 2,
    backgroundColor: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: sizes.notificationAvatar + spacing.md,
    marginTop: spacing.xs,
  },
}));
