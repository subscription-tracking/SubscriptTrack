import { sizes } from '../design/tokens';
import { TonalButton } from './TonalButton';

/**
 * Geçiş sarmalayıcısı: eski çerçeveli düğme artık `TonalButton`'dır (kontrastlı sınır, 48 px hedef).
 * Yeni kodda doğrudan `TonalButton` kullanılır.
 */
export function OutlinedButton({ label, onPress, minHeight = sizes.tallButtonHeight }: { label: string; onPress: () => void; minHeight?: number }) {
  return <TonalButton label={label} onPress={onPress} minHeight={minHeight} />;
}
