import * as Haptics from 'expo-haptics';

/** Dokunma geri bildirimi: hata verirse (web, desteklemeyen cihaz, test) sessizce geçilir. */
function run(effect: () => Promise<void>): void {
  try {
    void effect().catch(() => undefined);
  } catch {
    // Titreşim yoksa özellik yoktur; uygulama akışı etkilenmez.
  }
}

/** Seçim değişimi gibi hafif dokunuş. */
export function tapFeedback(): void {
  run(() => Haptics.selectionAsync());
}

/** Uzun basma ve onay gibi belirgin dokunuş. */
export function pressFeedback(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}
