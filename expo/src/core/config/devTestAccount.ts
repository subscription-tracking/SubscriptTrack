/**
 * Yalnızca geliştirme derlemesinde (`__DEV__`) kullanılan test hesabı. Bilgiler
 * `expo/.env` içinde `EXPO_PUBLIC_TEST_EMAIL` ve `EXPO_PUBLIC_TEST_PASSWORD` olarak
 * verilir; kaynak koda yazılmaz. Release derlemelerinde bu değerleri tanımlama.
 */
export interface DevTestAccount {
  email: string;
  password: string;
}

const email = process.env.EXPO_PUBLIC_TEST_EMAIL?.trim();
const password = process.env.EXPO_PUBLIC_TEST_PASSWORD;

export const devTestAccount: DevTestAccount | null =
  __DEV__ && email && password ? { email, password } : null;
