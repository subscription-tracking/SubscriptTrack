import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { buildSubscriptionCsv } from '../domain/csvExport';
import { shareCsvFile } from '../data/exportFile';
import { FilledButtonLabel } from '../../../shared/widgets/FilledButtonLabel';

/**
 * Verileri dışa aktar (Flutter `ExportDataScreen`). Dosya paylaşımı aktif, aktif/duraklatılmış/iptal edilmiş
 * kayıtlar CSV'ye yazılır (Flutter ile aynı). Bulut dışa aktarma ve pano kopyalama bu sürümde kullanılamaz; nedeni
 * ekranda belirtilir.
 */
export function ExportScreen() {
  const { user } = useAuth();
  const query = useSubscriptionsQuery(user?.id);
  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? { status: 'error', message: 'Abonelikler yüklenemedi.', onRetry: () => void query.refetch() }
      : { status: 'ready', data: query.data ?? [] };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Verileri dışa aktar" />
      <AsyncStateView state={state}>{(subscriptions) => <ExportBody subscriptions={subscriptions} />}</AsyncStateView>
    </View>
  );
}

/** Flutter ile aynı kapsam: aktif, duraklatılmış ve iptal edilmiş kayıtlar. */
const EXPORTED_STATUSES = ['active', 'paused', 'cancelled'] as const;

function ExportBody({ subscriptions }: { subscriptions: Subscription[] }) {
  const snackbar = useSnackbar();
  const [busy, setBusy] = useState(false);
  const exported = subscriptions.filter((item) => (EXPORTED_STATUSES as readonly string[]).includes(item.status));
  const total = exported.length;

  async function share() {
    setBusy(true);
    try {
      await shareCsvFile(buildSubscriptionCsv(exported));
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'Dışa aktarılamadı.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="table-chart" size={sizes.iconButtonSize} color={colors.primary} />
          <Text style={textStyle('bodyLargeStrong', { marginLeft: spacing.sm, flex: 1 })}>Tekrar içe aktarılabilir CSV</Text>
        </View>
        <Text style={textStyle('bodySmall', { marginTop: spacing.xs })}>
          {`${total} abonelik; dışa aktarılan dosya tekrar içe aktarılabilir.`}
        </Text>
        <Text style={textStyle('bodySmall', { marginTop: spacing.xs })}>
          Dosya cihazında oluşturulur; sunucuya yüklenmez. Paylaştıktan sonra dosyayı kendi sorumluluğunda sakla.
        </Text>
      </View>

      <View style={styles.gap} />
      <FilledButtonLabel label="Dosya olarak paylaş" busy={busy} disabled={total === 0} onPress={() => void share()} />

      <View style={styles.gap} />
      <View style={styles.unavailable}>
        <MaterialIcons name="cloud-upload" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginLeft: spacing.sm, flex: 1 })}>
          Güvenli biçimde (bulut) dışa aktarma bu sürümde kullanılamıyor: sunucu tarafındaki işlev henüz canlıya alınmadı.
        </Text>
      </View>

      <View style={styles.gap} />
      <View style={styles.unavailable}>
        <MaterialIcons name="content-copy" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginLeft: spacing.sm, flex: 1 })}>
          Panoya kopyalama için pano bağımlılığı eklenmesi gerekir; şimdilik dosya paylaşımını kullan.
        </Text>
      </View>
      <View style={styles.bottom} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(colors.outline, 0.5),
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gap: {
    height: gaps.rowLoose - 2,
  },
  unavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.field + 2,
    borderWidth: borderWidth.hairline,
    borderColor: withAlpha(colors.outline, 0.5),
  },
  bottom: {
    height: sizes.bottomNavHeight,
  },
});
