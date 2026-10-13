import { buildCells } from './calendarGrid';

describe('calendarGrid', () => {
  it('artık yıl şubatını tam haftalarla ve komşu aylarla oluşturur', () => {
    const weeks = buildCells(2024, 2);
    const cells = weeks.flat();
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(29);
    expect(cells[0].date.month).toBe(1);
    expect(cells.at(-1)?.date.month).toBe(3);
  });

  it('ocak başında önceki yılın günlerini taşır', () => {
    const first = buildCells(2026, 1)[0][0];
    expect(first.date.year).toBe(2025);
    expect(first.date.month).toBe(12);
    expect(first.inMonth).toBe(false);
  });
});
