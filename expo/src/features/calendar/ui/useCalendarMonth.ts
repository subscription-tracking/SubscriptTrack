import { useMemo, useState } from 'react';
import { civilDate, dayNumber, type CivilDate } from '../../../core/time/calendar';
import type { Subscription } from '../../subscriptions/domain/subscription';
import { buildCells } from '../domain/calendarGrid';
import { monthTotalsByCurrency, renewalDaysInMonth, renewalsOnDay, shiftMonth, trialDaysInMonth, trialsOnDay } from '../domain/calendarDays';

const URGENT_WINDOW_DAYS = 3;
export function useCalendarMonth(subscriptions: Subscription[], today: CivilDate) {
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<CivilDate | null>(today);

  const weeks = useMemo(() => buildCells(view.year, view.month), [view]);
  const renewalDays = useMemo(() => renewalDaysInMonth(subscriptions, today, view.year, view.month), [subscriptions, today, view]);
  const trialDays = useMemo(() => trialDaysInMonth(subscriptions, view.year, view.month), [subscriptions, view]);
  const totals = useMemo(() => monthTotalsByCurrency(subscriptions, today, view.year, view.month), [subscriptions, today, view]);

  function move(delta: number) {
    setView(shiftMonth(view.year, view.month, delta));
    setSelected(null);
  }

  const dayEvents = selected
    ? [...renewalsOnDay(subscriptions, today, selected).map((subscription) => ({ subscription, isTrial: false })), ...trialsOnDay(subscriptions, selected).map((subscription) => ({ subscription, isTrial: true }))]
    : [];

  function isUrgent(day: number): boolean {
    const diff = dayNumber(civilDate(view.year, view.month, day)) - dayNumber(today);
    return diff >= 0 && diff <= URGENT_WINDOW_DAYS;
  }

  /** Yenileme tarihi geçmiş (gecikmiş vade) gün mü? Yalnızca bugünden önceki günler. */
  function isOverdue(day: number): boolean {
    return dayNumber(civilDate(view.year, view.month, day)) < dayNumber(today);
  }

  return { view, selected, setSelected, weeks, renewalDays, trialDays, totals, dayEvents, move, isUrgent, isOverdue };
}
