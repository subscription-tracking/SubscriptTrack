import decodeUriComponent from '../../../patches/decode-uri-component';
import { parse } from 'query-string';

describe('hardened query decoder', () => {
  it('decodes valid UTF-8 and preserves malformed percent sequences', () => {
    expect(decodeUriComponent('%E2%9C%93%20plan')).toBe('✓ plan');
    expect(decodeUriComponent('%E0%A4%A')).toBe('%E0%A4%A');
    expect(parse('next=%E0%A4%A')).toEqual({ next: '%E0%A4%A' });
  });

  it('handles long malformed query values in bounded linear work', () => {
    const malformed = '%E0%A4%A'.repeat(10_000);
    expect(parse(`next=${malformed}`).next).toBe(malformed);
  });
});
