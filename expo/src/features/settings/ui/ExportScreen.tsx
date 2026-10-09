import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { buildSubscriptionCsv } from '../domain/csvExport';
import { shareCsvFile } from '../data/exportFile';

/** Verileri dışa aktar: tüm abonelikler 11 alanlı CSV olarak cihazdan paylaşılır. */
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

function ExportBody({ subscriptions }: { subscriptions: Subscription[] }) {
  const snackbar = useSnackbar();
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    try {
      await shareCsvFile(buildSubscriptionCsv(subscriptions));
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'Dışa aktarılamadı.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>{subscriptions.length} abonelik</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          Dosya CSV biçimindedir ve içe aktarılabilir. Tutar, tarih ve notlar dahil tüm alanlar yazılır.
        </Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          Dosya cihazında oluşturulur; sunucuya yüklenmez. Paylaştıktan sonra dosyayı kendi sorumluluğunda sakla.
        </Text>
      </View>
      <Spacer size={spacing.md} />
      <PrimaryButton label="Dosya olarak paylaş" onPress={() => void share()} loading={busy} disabled={subscriptions.length === 0} />
      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  content: {
    paddingHorizontal: screenGutter,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.xs,
  },
});
