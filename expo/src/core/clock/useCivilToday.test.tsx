import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useCivilToday } from './useCivilToday';

beforeEach(() => { jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() }); });
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

it('updates on the local midnight without remounting', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-12T20:59:59Z'));
  const { result, unmount } = renderHook(() => useCivilToday('Europe/Istanbul'));
  expect(result.current.day).toBe(12);
  act(() => { jest.advanceTimersByTime(1002); });
  expect(result.current.day).toBe(13);
  unmount();
  jest.useRealTimers();
});

it('refreshes after resume and resubscribes when the IANA zone changes', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-12T20:00:00Z'));
  let resume: (state: AppStateStatus) => void = () => undefined;
  const listener = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    resume = callback; return { remove: jest.fn() };
  });
  const { result, rerender, unmount } = renderHook((props: { zone: string }) => useCivilToday(props.zone), { initialProps: { zone: 'Europe/Istanbul' } });
  act(() => { jest.setSystemTime(new Date('2026-10-13T01:00:00Z')); resume('active'); });
  expect(result.current.day).toBe(13);
  rerender({ zone: 'America/Los_Angeles' });
  expect(result.current.day).toBe(12);
  unmount(); listener.mockRestore(); jest.useRealTimers();
});

it('crosses the DST autumn midnight using the local civil day', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-02T04:59:59Z'));
  const { result, unmount } = renderHook(() => useCivilToday('America/New_York'));
  expect(result.current.day).toBe(1);
  act(() => { jest.advanceTimersByTime(1002); });
  expect(result.current.day).toBe(2);
  unmount(); jest.useRealTimers();
});
