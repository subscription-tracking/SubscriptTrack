import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';

import { useAuth } from '../../auth/AuthProvider';
import { useUserTimeZone } from '../data/useActiveCurrency';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { buildSubscriptionCsv } from '../domain/csvExport';
import { shareCsvFile } from '../data/exportFile';
import { requestCloudExport } from '../data/cloudExportRepository';
import { FilledButtonLabel } from '../../../shared/widgets/FilledButtonLabel';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';

/**
 * Verileri dışa aktar. Tüm abonelik durumları cihaz CSV'sine yazılır;
 * bulut bağlantısı ve pano kopyalama ayrı eylemlerdir.
 */
export function ExportScreen() {
  useThemeRevision();
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
  useThemeRevision();
  const timeZone = useUserTimeZone();
  const snackbar = useSnackbar();
  const [busy, setBusy] = useState(false);
  const total = subscriptions.length;

  /** Bulut dışa aktarma: sunucuda CSV üretilir, 1 saat geçerli bağlantı paylaşılır. */
  async function cloudShare() {
    setBusy(true);
    try {
      const { downloadUrl } = await requestCloudExport();
      await Share.share({ message: downloadUrl, title: 'SubscriptTrack dışa aktarma' });
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'Dışa aktarılamadı.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (total === 0) return;
    setBusy(true);
    try {
      await Clipboard.setStringAsync(buildSubscriptionCsv(subscriptions));
      snackbar.show('CSV panoya kopyalandı.', 'primary');
    } catch {
      snackbar.show('Panoya kopyalanamadı.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    setBusy(true);
    try {
      await shareCsvFile(buildSubscriptionCsv(subscriptions), timeZone);
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
      <View pointerEvents={busy ? 'none' : 'auto'} style={busy ? styles.disabled : undefined} accessibilityState={{ disabled: busy, busy }}>
        <OutlinedButton label="Bulut bağlantısı oluştur (1 saat geçerli)" onPress={() => { if (!busy) void cloudShare(); }} />
      </View>

      <View style={styles.gap} />
      <View pointerEvents={busy ? 'none' : 'auto'} style={busy ? styles.disabled : undefined} accessibilityState={{ disabled: busy, busy }}>
        <OutlinedButton label="Panoya kopyala" onPress={() => { if (!busy) void copy(); }} />
      </View>
      <ScreenBottomInset />
    </ScrollView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
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
  disabled: {
    opacity: 0.5,
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
}));
