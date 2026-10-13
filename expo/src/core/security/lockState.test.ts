import { act, renderHook } from '@testing-library/react-native';

import { setAppLocked, useAppLocked } from './lockState';

afterEach(() => act(() => setAppLocked(false)));

describe('lockState', () => {
  it('hook, kilit değişince güncellenir', () => {
    const { result } = renderHook(() => useAppLocked());
    expect(result.current).toBe(false);
    act(() => setAppLocked(true));
    expect(result.current).toBe(true);
    act(() => setAppLocked(false));
    expect(result.current).toBe(false);
  });

  it('aynı değeri tekrar yazmak render üretmez', () => {
    let renders = 0;
    renderHook(() => { renders += 1; return useAppLocked(); });
    act(() => setAppLocked(true));
    const after = renders;
    act(() => setAppLocked(true));
    expect(renders).toBe(after);
  });
});
