import { ActionSheet, type ActionSheetItem } from '../../../../shared/widgets/ActionSheet';
import { type SubscriptionStatus } from '../../domain/subscription';
import { canTransition } from '../../domain/statusTransitions';

export type DetailMenuAction = 'pause' | 'resume' | 'archive' | 'cancel' | 'delete';

/** Devam ettirme satırının etiketi: hedef her zaman "aktif"; kaynak duruma göre ad değişir. */
function resumeLabel(status: SubscriptionStatus): string {
  if (status === 'paused') return 'Devam et';
  if (status === 'cancelled') return 'Yeniden etkinleştir';
  if (status === 'archived') return 'Arşivden çıkar';
  return 'Aktif yap';
}

/** Mevcut duruma göre geçerli menü satırları; yanlış kaydı silme her zaman en altta ve yıkıcıdır. */
export function detailMenuItems(
  status: SubscriptionStatus,
  onAction: (action: DetailMenuAction) => void,
  deleting: boolean,
): ActionSheetItem[] {
  const items: ActionSheetItem[] = [];
  if (canTransition(status, 'paused')) {
    items.push({ key: 'pause', label: 'Duraklat', icon: 'pause-circle-outline', hint: 'Kayıt listede kalır', onPress: () => onAction('pause') });
  }
  if (canTransition(status, 'active')) {
    items.push({ key: 'resume', label: resumeLabel(status), icon: 'play-circle-outline', onPress: () => onAction('resume') });
  }
  if (canTransition(status, 'archived')) {
    items.push({ key: 'archive', label: 'Arşivle', icon: 'archive', hint: 'Takipten çıkar', onPress: () => onAction('archive') });
  }
  if (canTransition(status, 'cancelled')) {
    items.push({ key: 'cancel', label: 'İptal ettim', icon: 'event-busy', hint: 'Tarihi kaydet', onPress: () => onAction('cancel') });
  }
  items.push({ key: 'delete', label: 'Yanlış kaydı sil', icon: 'delete-outline', tone: 'danger', disabled: deleting, onPress: () => onAction('delete') });
  return items;
}

/** ⋯ menüsü: aboneliğin durumuna göre eylem sayfası. */
export function DetailMenu({
  visible,
  name,
  status,
  deleting,
  onClose,
  onAction,
}: {
  visible: boolean;
  name: string;
  status: SubscriptionStatus;
  deleting: boolean;
  onClose: () => void;
  onAction: (action: DetailMenuAction) => void;
}) {
  return <ActionSheet visible={visible} title={name} items={detailMenuItems(status, onAction, deleting)} onClose={onClose} />;
}
