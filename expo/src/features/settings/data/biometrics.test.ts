import * as Native from 'expo-local-authentication';
import { authenticateWithBiometrics, biometricsAvailable } from './biometrics';
jest.mock('expo-local-authentication', () => ({ authenticateAsync: jest.fn(), hasHardwareAsync: jest.fn(), isEnrolledAsync: jest.fn() }));
it('cancellation or native failure never unlocks and disables device PIN fallback', async () => {
  jest.mocked(Native.authenticateAsync).mockResolvedValue({ success: false, error: 'user_cancel' });
  expect(await authenticateWithBiometrics()).toBe(false);
  expect(Native.authenticateAsync).toHaveBeenCalledWith(expect.objectContaining({ disableDeviceFallback: true }));
  jest.mocked(Native.authenticateAsync).mockRejectedValue(new Error('hardware failure'));
  expect(await authenticateWithBiometrics()).toBe(false);
});
it('requires both hardware and enrolled biometric', async () => {
  jest.mocked(Native.hasHardwareAsync).mockResolvedValue(true);
  jest.mocked(Native.isEnrolledAsync).mockResolvedValue(false);
  expect(await biometricsAvailable()).toBe(false);
  jest.mocked(Native.isEnrolledAsync).mockResolvedValue(true);
  expect(await biometricsAvailable()).toBe(true);
});
