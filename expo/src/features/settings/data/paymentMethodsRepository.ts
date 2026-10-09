import { supabase } from '../../../core/supabase/client';

/**
 * Ödeme yöntemleri (`payment-methods`). GET listeyi, PUT tüm listeyi yazar ([API.md §5](../../../../../docs/reference/API.md)).
 * Kart numarası veya hassas ödeme bilgisi alınmaz; yalnızca yöntem adları.
 */

interface MethodsBody {
  methods?: unknown;
}

export async function fetchPaymentMethods(): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke<MethodsBody>('payment-methods', { method: 'GET' });
  if (error) throw new Error('Ödeme yöntemleri yüklenemedi. Bağlantını kontrol edip tekrar dene.');
  return Array.isArray(data?.methods) ? data.methods.filter((item): item is string => typeof item === 'string') : [];
}

export async function savePaymentMethods(methods: string[]): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke<MethodsBody>('payment-methods', {
    method: 'PUT',
    body: { methods },
  });
  if (error) throw new Error('Ödeme yöntemleri kaydedilemedi. Tekrar dene.');
  return Array.isArray(data?.methods) ? data.methods.filter((item): item is string => typeof item === 'string') : methods;
}
