import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { fetchPaymentMethods, savePaymentMethods } from '../data/paymentMethodsRepository';
import { addPaymentMethod, METHOD_MAX_COUNT, removePaymentMethod } from '../domain/paymentMethodRules';

/** Ödeme yöntemleri: kullanıcının kullandığı kart ve hesap adları. Kart numarası alınmaz. */
export function PaymentMethodsScreen() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['payment-methods', user?.id ?? ''],
    queryFn: fetchPaymentMethods,
    enabled: Boolean(user),
    networkMode: 'always',
  });
  const state: AsyncState<string[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? { status: 'error', message: 'Ödeme yöntemleri yüklenemedi.', onRetry: () => void query.refetch() }
      : { status: 'ready', data: query.data ?? [] };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Ödeme yöntemleri" />
      <AsyncStateView state={state}>
        {(methods) => <MethodsEditor key={methods.join('|')} initial={methods} userId={user?.id ?? ''} />}
      </AsyncStateView>
    </View>
  );
}

function MethodsEditor({ initial, userId }: { initial: string[]; userId: string }) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [methods, setMethods] = useState(initial);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dirty = useMemo(() => methods.join('\u0001') !== initial.join('\u0001'), [methods, initial]);

  const save = useMutation({
    mutationFn: () => savePaymentMethods(methods),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['payment-methods', userId] });
      setMethods(saved);
      snackbar.show('Ödeme yöntemleri kaydedildi.', 'primary');
    },
    onError: (err: Error) => snackbar.show(err.message, 'error'),
  });

  function add() {
    const result = addPaymentMethod(methods, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setMethods(result.methods);
    setDraft('');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <TextField label="Yöntem adı (örn. Garanti Bonus)" value={draft} onChangeText={setDraft} error={error} maxLength={80} editable={!save.isPending} />
        <PrimaryButton label="Ekle" onPress={add} disabled={save.isPending || methods.length >= METHOD_MAX_COUNT} tall={false} />
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          En fazla {METHOD_MAX_COUNT} yöntem. Kart numarası girme; yalnızca hangi kartla ödediğini ayırt edecek bir ad yaz.
        </Text>
      </View>

      <Spacer size={spacing.md} />
      {methods.length === 0 ? (
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Henüz yöntem eklenmedi.</Text>
      ) : (
        methods.map((name) => (
          <View key={name} style={styles.row}>
            <Text style={[textStyle('titleSmall'), styles.rowText]}>{name}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${name} yöntemini kaldır`}
              onPress={() => setMethods((current) => removePaymentMethod(current, name))}
              style={styles.remove}
            >
              <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
        ))
      )}

      <Spacer size={spacing.lg} />
      <PrimaryButton label="Kaydet" onPress={() => save.mutate()} loading={save.isPending} disabled={!dirty} />
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
    gap: spacing.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
  },
  rowText: {
    flex: 1,
  },
  remove: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
