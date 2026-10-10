import { trendState } from './trendState';

describe('trendState', () => {
  it('hiç ödeme yoksa empty', () => {
    expect(trendState([0, 0, 0])).toBe('empty');
  });

  it('yalnızca bir ayda ödeme varsa single', () => {
    expect(trendState([0, 0, 500])).toBe('single');
  });

  it('en az iki ayda ödeme varsa ready', () => {
    expect(trendState([100, 0, 500])).toBe('ready');
  });

  it('boş dizi empty', () => {
    expect(trendState([])).toBe('empty');
  });
});
