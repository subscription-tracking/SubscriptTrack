import { setEffectiveTheme, themedStyles } from './themeRuntime';

describe('themedStyles sıralama', () => {
  afterEach(() => setEffectiveTheme('dark'));

  it('for…in ve spread ile anahtarları listeler ve tema değişince güncel değeri verir', () => {
    const style = themedStyles(() => ({ color: 'x', fontSize: 14 }));
    const seen: string[] = [];
    for (const key in style) seen.push(key);
    expect(seen).toEqual(['color', 'fontSize']);
    expect({ ...style }).toEqual({ color: 'x', fontSize: 14 });
    expect(Object.keys(style)).toEqual(['color', 'fontSize']);
  });

  it('açık ve koyu temada farklı fabrika sonucunu yansıtır', () => {
    let calls = 0;
    const style = themedStyles(() => ({ tone: `t${calls += 1}` }));
    setEffectiveTheme('dark');
    const dark = { ...style };
    setEffectiveTheme('light');
    const light = { ...style };
    expect(dark.tone).not.toBe(light.tone);
  });
});
