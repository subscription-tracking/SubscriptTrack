export type ConnectionState = 'online' | 'offline' | 'unknown';

export interface SubmitResult {
  status: 'sent' | 'queued';
  eventSaved: boolean;
  connection?: ConnectionState;
  /** Ekleme çevrimiçi hemen gönderildiyse yeni kaydın kimliği; kuyrukta ya da güncellemede yoktur. */
  createdId?: string | null;
  /** Custom reminder rules are durably managed within the create operation. */
  remindersManaged?: true;
}

export interface SyncReport {
  rejected: number;
  eventsMissed: number;
  pending: number;
}
