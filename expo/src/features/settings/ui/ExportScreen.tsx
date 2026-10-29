import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useRef, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';

import { useAuth } from '../../auth/AuthProvider';
import { useUserTimeZone } from '../data/useActiveCurrency';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
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
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { SettingsPanel } from './SettingsControls';

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
  const [activeAction, setActiveAction] = useState<'file' | 'cloud' | 'copy' | null>(null);
  const actionInFlight = useRef(false);
  const busy = activeAction !== null;
  const total = subscriptions.length;

  /** Bulut dışa aktarma: CSV bulutta üretilir, 1 saat geçerli bağlantı paylaşılır. */
  async function cloudShare() {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActiveAction('cloud');
    try {
      const { downloadUrl } = await requestCloudExport();
      await Share.share({ message: downloadUrl, title: 'SubscriptTrack dışa aktarma' });
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'Dışa aktarılamadı.', 'error');
    } finally {
      actionInFlight.current = false;
      setActiveAction(null);
    }
  }

  async function copy() {
    if (total === 0 || actionInFlight.current) return;
    actionInFlight.current = true;
    setActiveAction('copy');
    try {
      await Clipboard.setStringAsync(buildSubscriptionCsv(subscriptions));
      snackbar.show('CSV panoya kopyalandı.', 'primary');
    } catch {
      snackbar.show('Panoya kopyalanamadı.', 'error');
    } finally {
      actionInFlight.current = false;
      setActiveAction(null);
    }
  }

  async function share() {
    if (total === 0 || actionInFlight.current) return;
    actionInFlight.current = true;
    setActiveAction('file');
    try {
      await shareCsvFile(buildSubscriptionCsv(subscriptions), timeZone);
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'Dışa aktarılamadı.', 'error');
    } finally {
      actionInFlight.current = false;
      setActiveAction(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SettingsPanel style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="table-chart" size={sizes.iconButtonSize} color={colors.primary} />
          <Text style={textStyle('bodyStrong', { marginLeft: spacing.sm, flex: 1 })}>Tekrar içe aktarılabilir CSV</Text>
        </View>
        <Text style={textStyle('bodySmall', { marginTop: spacing.xs })}>
          {`${total} abonelik; dışa aktarılan dosya tekrar içe aktarılabilir.`}
        </Text>
      </SettingsPanel>

      <View style={styles.gap} />
      <SettingsPanel style={styles.actionCard}>
      <PrimaryButton label="Dosya olarak paylaş" loading={activeAction === 'file'} disabled={busy || total === 0} onPress={() => void share()} />
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
        Nasıl çalışır: Dosya cihazında oluşturulur, sunucuya yüklenmez.
      </Text>
      </SettingsPanel>

      <View style={styles.gap} />
      <SettingsPanel style={styles.actionCard}>
      <TonalButton label={activeAction === 'cloud' ? 'Bağlantı hazırlanıyor' : 'Bulut bağlantısı oluştur'} disabled={busy} onPress={() => void cloudShare()} />
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
        Nasıl çalışır: Dosya sunucuya yüklenir ve 1 saat geçerli bir bağlantıyla paylaşılır.
      </Text>
      </SettingsPanel>

      <View style={styles.gap} />
      <SettingsPanel style={styles.actionCard}>
      <TonalButton label={activeAction === 'copy' ? 'Panoya kopyalanıyor' : 'Panoya kopyala'} disabled={busy || total === 0} onPress={() => void copy()} />
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
        Nasıl çalışır: CSV metni yalnızca bu cihazın panosuna kopyalanır, sunucuya yüklenmez.
      </Text>
      </SettingsPanel>
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
  },
  actionCard: {
    padding: spacing.md,
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
    borderColor: colors.border,
  },
  bottom: {
    height: sizes.bottomNavHeight,
  },
}));
