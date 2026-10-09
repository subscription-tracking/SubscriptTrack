import { type SubscriptionStatus } from './subscription';

/**
 * Durum geçiş kuralları. Flutter `SubscriptionStatusExt._allowed` ve sunucudaki
 * [DOMAIN §3](../../../../../docs/product/DOMAIN.md) ile aynıdır. I/O yoktur.
 */

const ALLOWED: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  trial: ['active', 'cancelled', 'expired', 'archived'],
  active: ['paused', 'cancelled', 'archived'],
  paused: ['active', 'cancelled', 'archived'],
  cancelled: ['expired', 'archived'],
  expired: ['active', 'archived'],
  archived: ['active'],
};

export function canTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return ALLOWED[from].includes(to);
}

export type StatusAction = 'activate' | 'pause' | 'resume' | 'cancel' | 'archive' | 'restore';

export interface StatusActionSpec {
  action: StatusAction;
  target: SubscriptionStatus;
  label: string;
  /** Onay penceresi metni. Silme yok; her aksiyon geri alınabilir bir durum değişikliğidir. */
  confirmMessage: string;
  /** İptal ve arşiv: onay penceresinde vurgulanır. */
  destructive: boolean;
}

const SPECS: Record<StatusAction, StatusActionSpec> = {
  activate: {
    action: 'activate',
    target: 'active',
    label: 'Aktif yap',
    confirmMessage: 'Abonelik aktif yapılsın mı? Yenileme takibi başlar.',
    destructive: false,
  },
  pause: {
    action: 'pause',
    target: 'paused',
    label: 'Duraklat',
    confirmMessage: 'Abonelik duraklatılsın mı? Yenileme takibi durur, kayıt listede kalır.',
    destructive: false,
  },
  resume: {
    action: 'resume',
    target: 'active',
    label: 'Devam ettir',
    confirmMessage: 'Abonelik yeniden aktif olsun mu?',
    destructive: false,
  },
  cancel: {
    action: 'cancel',
    target: 'cancelled',
    label: 'İptal edildi olarak işaretle',
    confirmMessage: 'Abonelik iptal edildi olarak işaretlensin mi? Sağlayıcı tarafında iptal ettiğinden emin ol.',
    destructive: true,
  },
  archive: {
    action: 'archive',
    target: 'archived',
    label: 'Arşivle',
    confirmMessage: 'Abonelik arşivlensin mi? Ana listeden kalkar, arşivden geri alınabilir.',
    destructive: true,
  },
  restore: {
    action: 'restore',
    target: 'active',
    label: 'Arşivden çıkar',
    confirmMessage: 'Abonelik arşivden çıkarılıp aktif yapılsın mı?',
    destructive: false,
  },
};

/** Her durumda kullanıcıya sunulan aksiyonlar. Sıra ekranda gösterilen sıradır. */
const ACTIONS_BY_STATUS: Record<SubscriptionStatus, readonly StatusAction[]> = {
  trial: ['activate', 'cancel', 'archive'],
  active: ['pause', 'cancel', 'archive'],
  paused: ['resume', 'cancel', 'archive'],
  cancelled: ['archive'],
  expired: ['activate', 'archive'],
  archived: ['restore'],
};

export function actionsFor(from: SubscriptionStatus): StatusActionSpec[] {
  return ACTIONS_BY_STATUS[from].map((action) => SPECS[action]);
}
