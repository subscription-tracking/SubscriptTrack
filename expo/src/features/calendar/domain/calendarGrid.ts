import { civilDate, daysInMonth, type CivilDate } from '../../../core/time/calendar';
import { monthGrid, shiftMonth } from './calendarDays';

interface GridCell {
  day: number;
  date: CivilDate;
  inMonth: boolean;
}

/** Ay ızgarası: önceki ay günleri, bu ayın günleri, sonraki ay günleriyle haftayı tamamlar (Flutter `_cells`). */
export function buildCells(year: number, month: number): GridCell[][] {
  const grid = monthGrid(year, month);
  const leading = grid.findIndex((cell) => cell !== null);
  const previous = shiftMonth(year, month, -1);
  const previousDays = daysInMonth(previous.year, previous.month);
  const cells: GridCell[] = [];
  for (let i = leading - 1; i >= 0; i -= 1) {
    const day = previousDays - i;
    cells.push({ day, date: civilDate(previous.year, previous.month, day), inMonth: false });
  }
  for (const cell of grid) {
    if (cell) cells.push({ day: cell.date.day, date: cell.date, inMonth: true });
  }
  const next = shiftMonth(year, month, 1);
  for (let day = 1; cells.length % 7 !== 0; day += 1) {
    cells.push({ day, date: civilDate(next.year, next.month, day), inMonth: false });
  }
  return chunk(cells, 7);
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

