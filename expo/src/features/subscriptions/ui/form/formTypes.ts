import type { SubscriptionFormValues } from '../../domain/subscriptionForm';

/** Form bölümlerinin ortak alan değiştirme işlevi. */
export type FormChange = <K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) => void;
