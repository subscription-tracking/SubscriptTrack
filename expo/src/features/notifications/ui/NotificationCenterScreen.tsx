import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatLongDate } from '../../../core/format/date';
import { civilDate } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { Spacer } from '../../../shared/widgets/Spacer';
import { type CenterNotification } from '../data/notificationRepository';
import { useNotificationsQuery } from '../data/queries';
import { notificationText } from '../domain/notificationCenter';

/** Bildirim merkezi: son 14 günün bildirimleri. Dokununca abonelik detayına gider. */
export function NotificationCenterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const query = useNotificationsQuery(user?.id);

  const state: AsyncState<CenterNotification[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Bildirimler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : (query.data ?? []).length === 0
        ? {
            status: 'empty',
            title: 'Bildirim yok',
            description: 'Yenileme ve deneme hatırlatmaların burada görünür.',
          }
        : { status: 'ready', data: query.data ?? [] };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
        </Pressable>
        <Text style={textStyle('title')}>Bildirimler</Text>
      </View>
      <Spacer size={spacing.md} />
      <AsyncStateView state={state}>
        {(items) => (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <Spacer size={spacing.xs} />}
            renderItem={({ item }) => (
              <NotificationRow
                item={item}
                onPress={() => {
                  if (item.subscriptionId) router.push(`/subscriptions/${item.subscriptionId}` as Href);
                }}
              />
            )}
          />
        )}
      </AsyncStateView>
    </View>
  );
}

function NotificationRow({ item, onPress }: { item: CenterNotification; onPress: () => void }) {
  const text = notificationText(item.kind, { name: item.name, days: item.days });
  const created = new Date(item.createdAt);
  const unread = item.readAt === null;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.dot, { backgroundColor: unread ? colors.primary : colors.outline }]} />
      <View style={styles.text}>
        <Text style={textStyle('titleSmall')}>{text.title}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{text.body}</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          {formatLongDate(civilDate(created.getFullYear(), created.getMonth() + 1, created.getDate()))}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: screenGutter - 8,
    height: sizes.minTouchTarget,
  },
  backButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: screenGutter,
    paddingBottom: sizes.bottomNavHeight + spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
  },
  pressed: {
    opacity: 0.85,
  },
  dot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radius.xs,
    marginTop: spacing.xs,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
