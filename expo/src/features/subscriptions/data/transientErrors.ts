import { DataWriteError } from '../../../core/errors/dataWriteError';

/**
 * Geçici (yeniden denenebilir) sunucu hata kodları: serileştirme/deadlock, iptal edilen sorgu,
 * kilit alınamadı, yönetici kapatması ve PostgREST bağlantı/şema önbelleği hataları.
 * Bağlantı (sınıf 08) ve kaynak/yük (sınıf 53) hataları önek ile eşleşir.
 */
export const TRANSIENT_ERROR_CODES: ReadonlySet<string> = new Set([
  '40001', '40P01', '57014', '55P03', '57P01', '57P02', '57P03',
  'PGRST000', 'PGRST001', 'PGRST002', 'PGRST003',
]);
const TRANSIENT_CODE_CLASSES = ['08', '53'] as const;

/** Kod yoksa istek sunucuya ulaşmamıştır (ağ) ve yeniden denenir. */
export function isTransientCode(code: string | null | undefined): boolean {
  if (!code) return true;
  return TRANSIENT_ERROR_CODES.has(code) || TRANSIENT_CODE_CLASSES.some((prefix) => code.startsWith(prefix));
}

/** RPC çağrısı için varsayılan zaman aşımı. Aynı idempotency anahtarıyla tekrar gönderim güvenlidir. */
export const WRITE_TIMEOUT_MS = 20_000;

/** Zaman aşımında yeniden denenebilir `DataWriteError` fırlatır; asıl istek arka planda sonlanır. */
export async function withWriteTimeout<T>(
  work: PromiseLike<T>,
  makeError: (message: string) => DataWriteError,
  ms: number = WRITE_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(makeError('Sunucu zamanında yanıt vermedi. Bağlantını kontrol edip tekrar dene.')), ms);
  });
  try {
    return await Promise.race([Promise.resolve(work), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
