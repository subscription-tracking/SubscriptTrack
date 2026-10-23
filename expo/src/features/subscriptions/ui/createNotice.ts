import type { CreateNotice } from '../data/createSubscriptionCoordinator';

const messages: Record<CreateNotice, { message: string; tone: 'error' | 'default' }> = {
  reminders_failed: { message: 'Abonelik kaydedildi ama hatırlatmalar eklenemedi. Ayrıntılardan düzenleyebilirsin.', tone: 'error' },
  paid_failed: { message: 'Abonelik kaydedildi ama ilk ödeme eklenemedi. Ödeme geçmişinden ekleyebilirsin.', tone: 'error' },
  deferred_failed: { message: 'Abonelik kaydedildi ama ertelenen ödeme eklenemedi.', tone: 'error' },
  paid_unavailable: { message: 'İlk ödeme bağlantı gelince eklenmez; ödeme geçmişinden ekleyebilirsin.', tone: 'default' },
  deferred_unavailable: { message: 'Ertelenen ödeme bağlantı gelince eklenmez; ödeme geçmişinden ekleyebilirsin.', tone: 'default' },
};

export const createNotice = (code: CreateNotice) => messages[code];
