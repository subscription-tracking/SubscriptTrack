import type { CivilDate } from '../../../../core/time/calendar';
import type { FormErrors, SubscriptionFormValues } from '../../domain/subscriptionForm';
export interface DetailsSectionProps {
  values: SubscriptionFormValues;
  errors: FormErrors;
  today: CivilDate;
  disabled: boolean;
  showInitialPayment: boolean;
  /** Bölüm durumu üst ekrandan yönetilebilir (doğrulama hatasında otomatik açılır); verilmezse bölüm kendi durumunu tutar. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onChange: <K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) => void;
}
