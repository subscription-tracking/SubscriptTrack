import { useRef } from 'react';
import type { LayoutChangeEvent, ScrollViewInstance } from 'react-native';

import type { FormErrors } from '../../domain/subscriptionForm';

export type FormSectionKey = 'service' | 'amount' | 'renewal' | 'extras';

/** Hata anahtarının bulunduğu bölüm. */
function sectionOf(errors: FormErrors): FormSectionKey {
  if (errors.name) return 'service';
  if (errors.amount) return 'amount';
  if (errors.nextRenewalDate || errors.reminderDays) return 'renewal';
  return 'extras';
}

/**
 * Doğrulama hatasında ilk hatalı bölüme kaydırır. Bölümler kaydırma gövdesinin doğrudan çocuğu olduğundan
 * `onLayout` y değeri doğrudan kaydırma konumudur; konum bilinmiyorsa en üste çıkar.
 */
export function useErrorScroll() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Partial<Record<FormSectionKey, number>>>({});

  function onLayoutFor(key: FormSectionKey) {
    return (event: LayoutChangeEvent) => {
      offsets.current[key] = event.nativeEvent.layout.y;
    };
  }

  function scrollToFirstError(errors: FormErrors) {
    const y = offsets.current[sectionOf(errors)] ?? 0;
    scrollRef.current?.scrollTo?.({ y: Math.max(0, y - 8), animated: true });
  }

  return { scrollRef, onLayoutFor, scrollToFirstError };
}
