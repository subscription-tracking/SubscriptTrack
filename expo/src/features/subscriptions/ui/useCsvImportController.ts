import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthProvider';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { zoneToday, type CivilDate } from '../../../core/time/calendar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { pickCsvText } from '../data/csvFile';
import { importSubscriptionRows } from '../data/csvImport';
import { subscriptionKeys } from '../data/queries';
import { parseSubscriptionCsv, type ParseResult } from '../domain/csvImportParser';

export function useCsvImportController() {
  const router = useRouter();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const timeZone = useUserTimeZone();
  const today = useMemo<CivilDate>(() => zoneToday(timeZone), [timeZone]);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick() {
    try {
      const text = await pickCsvText();
      if (text === null) return;
      setParsed(parseSubscriptionCsv(text));
    } catch {
      snackbar.show('Dosya okunamadı. Farklı bir dosya dene.', 'error');
    }
  }

  async function runImport() {
    if (!user || !parsed || parsed.rows.length === 0) return;
    if (!online) {
      snackbar.show('İçe aktarma için internet bağlantısı gerekir.', 'error');
      return;
    }
    setBusy(true);
    try {
      const outcome = await importSubscriptionRows(user.id, parsed.rows, today, () => undefined);
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      const warning = outcome.warnings.length > 0
        ? ` ${outcome.warnings.length} kaydın durumu korunamadı; ayrıntıyı önizlemede gördün.`
        : '';
      snackbar.show(`${outcome.created} abonelik içe aktarıldı.${warning}`, outcome.warnings.length > 0 ? 'default' : 'primary');
      router.back();
    } catch (error) {
      snackbar.show(error instanceof Error ? error.message : 'İçe aktarılamadı.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return { parsed, busy, online, pick, runImport };
}
