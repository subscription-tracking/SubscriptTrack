/**
 * Veri yazma hatası. `retryable` ağ/oturum gibi geçici hatalarda true; sunucunun kalıcı
 * reddinde (kota, kayıt yok) false. Kuyruk ve senkron bu ayrıma göre karar verir.
 */
export interface DataWriteErrorOptions {
  /** PostgREST/SQLSTATE kodu. Yoksa istek sunucuya ulaşmamıştır (ağ). */
  code?: string;
  retryable?: boolean;
}

export class DataWriteError extends Error {
  readonly code: string | undefined;
  readonly retryable: boolean;

  constructor(message: string, options: DataWriteErrorOptions = {}) {
    super(message);
    this.name = 'DataWriteError';
    this.code = options.code;
    this.retryable = options.retryable ?? false;
  }
}
