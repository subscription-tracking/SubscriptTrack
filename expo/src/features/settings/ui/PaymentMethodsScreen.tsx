import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { KeyboardScreen } from '../../../shared/widgets/KeyboardScreen';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { fetchPaymentMethods, savePaymentMethods } from '../data/paymentMethodsRepository';
import { addPaymentMethod, METHOD_MAX_COUNT, removePaymentMethod, renamePaymentMethod } from '../domain/paymentMethodRules';
import { PaymentMethodDialog } from './PaymentMethodDialog';

/**
 * Ödeme yöntemleri (Flutter `PaymentMethodsScreen`): kart satırları, düzenle/sil, boş durum ve ekle diyaloğu.
 * Flutter değişiklikleri anında yerel olarak uygular; Expo'da değişiklikler "Kaydet" ile sunucuya yazılır.
 * Kart numarası alınmaz.
 */
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
    <KeyboardScreen style={styles.screen}>
      <ScreenTopBar title="Ödeme yöntemlerim" />
      <AsyncStateView state={state}>
        {(methods) => <MethodsEditor key={methods.join('|')} initial={methods} userId={user?.id ?? ''} />}
      </AsyncStateView>
    </KeyboardScreen>
  );
}

/** Diyalog durumu: ekleme ya da var olan bir adı düzenleme. */
type DialogState = { mode: 'add' } | { mode: 'edit'; name: string } | null;

function MethodsEditor({ initial, userId }: { initial: string[]; userId: string }) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [methods, setMethods] = useState(initial);
  const [dialog, setDialog] = useState<DialogState>(null);
  const dirty = useMemo(() => methods.join('\u0001') !== initial.join('\u0001'), [methods, initial]);
  const full = methods.length >= METHOD_MAX_COUNT;

  const save = useMutation({
    mutationFn: () => savePaymentMethods(methods),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['payment-methods', userId] });
      setMethods(saved);
      snackbar.show('Ödeme yöntemleri kaydedildi.', 'primary');
    },
    onError: (err: Error) => snackbar.show(err.message, 'error'),
  });

  /** Diyalogdan gelen adı uygular; hata varsa mesajı döndürür ve diyalog açık kalır. */
  function submit(raw: string): string | null {
    const result = dialog?.mode === 'edit' ? renamePaymentMethod(methods, dialog.name, raw) : addPaymentMethod(methods, raw);
    if (!result.ok) return result.error;
    setMethods(result.methods);
    setDialog(null);
    return null;
  }

  function confirmRemove(name: string) {
    Alert.alert('Ödeme yöntemini sil', `"${name}" ödeme yöntemini silmek istediğine emin misin?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => setMethods((current) => removePaymentMethod(current, name)) },
    ]);
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {methods.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="credit-card-off" size={sizes.emptyStateIcon} color={colors.onSurfaceVariant} />
            <Spacer size={spacing.sm} />
            <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'center' })}>Henüz bir ödeme yöntemi eklemedin.</Text>
            <Spacer size={spacing.md} />
            <PrimaryButton label="Ödeme yöntemi ekle" icon="add" tall={false} disabled={save.isPending} onPress={() => setDialog({ mode: 'add' })} />
          </View>
        ) : (
          <>
            {methods.map((name) => (
              <MethodCard
                key={name}
                name={name}
                onEdit={() => setDialog({ mode: 'edit', name })}
                onDelete={() => confirmRemove(name)}
              />
            ))}
            <Spacer size={spacing.md} />
            <PrimaryButton label="Yeni ödeme yöntemi" icon="add" tall={false} disabled={save.isPending || full} onPress={() => setDialog({ mode: 'add' })} />
            {full ? (
              <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
                {`En fazla ${METHOD_MAX_COUNT} yöntem eklenebilir.`}
              </Text>
            ) : null}
          </>
        )}

        <Spacer size={spacing.lg} />
        <PrimaryButton label="Kaydet" loading={save.isPending} disabled={!dirty} onPress={() => save.mutate()} />
        <ScreenBottomInset />
      </ScrollView>

      {dialog ? (
        <PaymentMethodDialog
          key={dialog.mode === 'edit' ? `edit-${dialog.name}` : 'add'}
          title={dialog.mode === 'edit' ? 'Ödeme yöntemini düzenle' : 'Yeni ödeme yöntemi ekle'}
          confirmLabel={dialog.mode === 'edit' ? 'Kaydet' : 'Ekle'}
          initialName={dialog.mode === 'edit' ? dialog.name : ''}
          onCancel={() => setDialog(null)}
          onSubmit={submit}
        />
      ) : null}
    </View>
  );
}

/** Flutter `_MethodCard`: 40 px kart ikonu, kalın ad ve düzenle/sil düğmeleri. */
function MethodCard({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <MaterialIcons name="credit-card" size={sizes.iconButtonSize} color={colors.primary} />
      </View>
      <Text numberOfLines={1} style={textStyle('titleSmall', { flex: 1, marginLeft: spacing.sm })}>
        {name}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${name} düzenle`} onPress={onEdit} style={styles.iconButton}>
        <MaterialIcons name="edit" size={sizes.rowActionIcon} color={colors.onSurfaceVariant} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${name} sil`} onPress={onDelete} style={styles.iconButton}>
        <MaterialIcons name="delete-outline" size={sizes.rowActionIcon} color={colors.error} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(colors.outline, 0.5),
    backgroundColor: colors.surface,
  },
  cardIcon: {
    width: sizes.minTouchTarget - spacing.sm,
    height: sizes.minTouchTarget - spacing.sm,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.12),
  },
  iconButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
