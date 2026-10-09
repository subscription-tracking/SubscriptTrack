/**
 * Geri bildirim ve destek kayıtları ([Flutter feedback_screen](../../../../../mobile/lib/features/settings/presentation/screens/feedback_screen.dart) ile aynı kategoriler).
 * Mesaj 1–2000 karakter; kategori en çok 60 karakter. I/O yoktur.
 */

export const FEEDBACK_CATEGORIES = ['Özellik isteği', 'Hata bildirimi', 'Genel öneri'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export const MESSAGE_MAX_LENGTH = 2000;

export function validateFeedbackMessage(message: string): string | null {
  const trimmed = message.trim();
  if (trimmed.length === 0) return 'Mesajını yazmalısın';
  if (trimmed.length > MESSAGE_MAX_LENGTH) return `En fazla ${MESSAGE_MAX_LENGTH} karakter`;
  return null;
}

/** Paylaşım metni (Flutter ile aynı biçim). */
export function feedbackShareText(category: FeedbackCategory, message: string): string {
  return `SubscriptTrack ${category}\n\n${message.trim()}`;
}
