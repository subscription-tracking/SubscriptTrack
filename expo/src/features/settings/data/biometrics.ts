import * as LocalAuthentication from 'expo-local-authentication';

/** Cihazda biyometri donanımı var mı ve kayıtlı bir biyometri var mı. Her ikisi de gerekir. */
export async function biometricsAvailable(): Promise<boolean> {
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hardware && enrolled;
  } catch {
    return false;
  }
}

/** Biyometri istemi. Cihaz PIN'ine geri dönmez; kullanıcı uygulama PIN'i ile açabilir. */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Uygulamanın kilidini aç',
      cancelLabel: 'PIN kullan',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
