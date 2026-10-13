import { fireEvent, render, screen, waitFor, act } from '@testing-library/react-native';
import { Alert, Pressable, Text } from 'react-native';
import { useDeletionAction } from './useDeletionAction';
const mockRemove = jest.fn();
const mockCancel = jest.fn();
const mockInvalidate = jest.fn();
const mockShow = jest.fn();
const mockEnv = { softDeletionEnabled: true };
jest.mock('../../../core/config/env', () => ({ get env() { return mockEnv; } }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'delete-idempotency-key' }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mockInvalidate }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockShow }) }));
jest.mock('../data/subscriptionSync', () => ({ removeSubscriptions: (...args: unknown[]) => mockRemove(...args) }));
jest.mock('../data/queries', () => ({ subscriptionKeys: { all: (id: string) => ['subscriptions', id] } }));
jest.mock('../../notifications/data/notificationScheduler', () => ({ cancelSubscriptionReminders: (...args: unknown[]) => mockCancel(...args) }));
const ids = ['10000000-0000-0000-0000-000000000001'];
function Probe() { const action = useDeletionAction(); return <Pressable accessibilityRole="button" onPress={() => action.confirm(ids)}><Text>Delete</Text></Pressable>; }
beforeEach(() => {
  jest.clearAllMocks(); mockEnv.softDeletionEnabled = true;
  mockRemove.mockResolvedValue({ status: 'queued' });mockCancel.mockResolvedValue(undefined);mockInvalidate.mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());
it('cancel confirmation causes no write or native cancellation', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<Probe />); fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
  expect(alert.mock.calls[0][2]?.[0].style).toBe('cancel');
  expect(mockRemove).not.toHaveBeenCalled(); expect(mockCancel).not.toHaveBeenCalled();
});
it('confirmed offline deletion persists once, invalidates local view, and cancels reminders', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<Probe />);fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
  act(() => { alert.mock.calls[0][2]?.[1].onPress?.(); alert.mock.calls[0][2]?.[1].onPress?.(); });
  await waitFor(() => expect(mockCancel).toHaveBeenCalledWith(ids));
  expect(mockRemove).toHaveBeenCalledTimes(1);expect(mockRemove).toHaveBeenCalledWith('user-1', ids, 'delete-idempotency-key');
});
it('unsupported backend blocks before confirmation or local hiding', () => {
  mockEnv.softDeletionEnabled=false; const alert=jest.spyOn(Alert,'alert').mockImplementation(() => undefined);
  render(<Probe />);fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
  expect(alert).not.toHaveBeenCalled();expect(mockRemove).not.toHaveBeenCalled();expect(mockShow).toHaveBeenCalledWith(expect.stringContaining('şu an kullanılamıyor'), 'error');
});
it('native cancellation failure is visible after saved deletion', async () => {
  mockCancel.mockRejectedValue(new Error('alarm service'));
  const alert=jest.spyOn(Alert,'alert').mockImplementation(() => undefined);
  render(<Probe />);fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
  act(() => alert.mock.calls[0][2]?.[1].onPress?.());
  await waitFor(() => expect(mockShow).toHaveBeenCalledWith(expect.stringContaining('yeniden denenecek'), 'error'));
});

// Senaryo 21: toplu silme tüm seçili kayıtları tek yazımda kaldırır ve hepsinin hatırlatmasını iptal eder.
function BulkProbe({ selected }: { selected: string[] }) { const action = useDeletionAction(); return <Pressable accessibilityRole="button" onPress={() => action.confirm(selected)}><Text>Bulk</Text></Pressable>; }
it('toplu silmede tüm seçili kimlikleri tek istekte gönderir ve hepsinin hatırlatmasını iptal eder', async () => {
  const selected = ['10000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-0000000000a3'];
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<BulkProbe selected={selected} />);
  fireEvent.press(screen.getByRole('button', { name: 'Bulk' }));
  expect(alert.mock.calls[0][1]).toContain('3 kayıt');
  act(() => alert.mock.calls[0][2]?.[1].onPress?.());
  await waitFor(() => expect(mockCancel).toHaveBeenCalledWith(selected));
  expect(mockRemove).toHaveBeenCalledTimes(1);
  expect(mockRemove).toHaveBeenCalledWith('user-1', selected, 'delete-idempotency-key');
});
