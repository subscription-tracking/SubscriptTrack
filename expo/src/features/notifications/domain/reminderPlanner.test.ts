import { type SubscriptionRow, subscriptionFromRow, type Subscription } from '../../subscriptions/domain/subscription';
import { REMINDER_LIMIT, SNOOZE_IDENTIFIER_PREFIX, SNOOZE_MINUTES, isPlannedIdentifier, planReminders, renewalDaysFor, timezoneChanged } from './reminderPlanner';

const row = (overrides: Partial<SubscriptionRow>): SubscriptionRow => ({
  id: 'sub-1',
  name: 'Netflix',
  amount: '149.99',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-20',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  notification_rules: [],
  ...overrides,
});
const sub = (overrides: Partial<SubscriptionRow>): Subscription => subscriptionFromRow(row(overrides));

// Şu an 9 Ekim sabahı: 09:00 teslimleri hâlâ gelecekte olur.
const now = new Date(2026, 9, 9, 8, 0, 0);

describe('renewalDaysFor', () => {
  it('kural yoksa varsayılan gün sayısını kullanır', () => {
    expect(renewalDaysFor([], 3)).toEqual([3]);
  });

  it('yalnızca etkin kuralları, tekil ve artan sırada döner', () => {
    expect(
      renewalDaysFor(
        [
          { daysBefore: 7, enabled: true },
          { daysBefore: 1, enabled: false },
          { daysBefore: 3, enabled: true },
          { daysBefore: 3, enabled: true },
        ],
        3,
      ),
    ).toEqual([3, 7]);
  });

  it('kurallar varsa ama hiçbiri etkin değilse bildirim yoktur', () => {
    expect(renewalDaysFor([{ daysBefore: 3, enabled: false }], 3)).toEqual([]);
  });
});

describe('planReminders', () => {
  it('yenileme bildirimini kayıt gününden önce, yerel 09:00 olarak planlar', () => {
    const [reminder] = planReminders({ active: [sub({})], trials: [], defaultDays: 3, now });
    expect(reminder.scheduled).toEqual(new Date(2026, 9, 17, 9, 0, 0));
    expect(reminder.title).toBe('Netflix');
    expect(reminder.body).toBe('3 gün içinde yenileniyor — 149.99 TRY');
    expect(reminder.subscriptionId).toBe('sub-1');
  });

  it('kayıtta kural varsa varsayılanı yok sayar', () => {
    const planned = planReminders({
      active: [sub({ notification_rules: [{ daysBefore: 7, enabled: true }] })],
      trials: [],
      defaultDays: 3,
      now,
    });
    expect(planned).toHaveLength(1);
    expect(planned[0].scheduled).toEqual(new Date(2026, 9, 13, 9, 0, 0));
  });

  it('deneme bitişinden 7, 3 ve 1 gün önce planlar', () => {
    const trial = sub({ id: 't', status: 'trial', trial_end_date: '2026-10-30' });
    const planned = planReminders({ active: [], trials: [trial], defaultDays: 3, now });
    expect(planned.map((item) => item.scheduled.getDate())).toEqual([23, 27, 29]);
    expect(planned[0].title).toBe('Netflix denemesi sona eriyor');
  });

  it('geçmişte kalan teslimleri eler', () => {
    const planned = planReminders({ active: [sub({ next_renewal_date: '2026-10-10' })], trials: [], defaultDays: 3, now });
    // 10 Ekim − 3 = 7 Ekim (geçmiş) elenir.
    expect(planned).toEqual([]);
  });

  it('en fazla limit kadar bildirim tutar ve en yakınları korur', () => {
    const many = Array.from({ length: 80 }, (_, index) =>
      sub({ id: `s-${index}`, next_renewal_date: `2026-${String((index % 9) + 10).padStart(2, '0')}-28`, start_date: '2026-01-01' }),
    );
    const planned = planReminders({ active: many, trials: [], defaultDays: 3, now });
    expect(planned.length).toBeLessThanOrEqual(REMINDER_LIMIT);
    const times = planned.map((item) => item.scheduled.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('aynı girdi aynı kimlikleri üretir (tekrar planlamayı önler)', () => {
    const input = { active: [sub({})], trials: [], defaultDays: 3, now };
    expect(planReminders(input).map((item) => item.identifier)).toEqual(planReminders(input).map((item) => item.identifier));
  });

  it('kimlikler bildirim türünü ayırır: yenileme ve deneme çakışmaz', () => {
    const renewal = sub({ id: 'x', next_renewal_date: '2026-10-30' });
    const trial = sub({ id: 'x', status: 'trial', trial_end_date: '2026-10-30' });
    const ids = planReminders({ active: [renewal], trials: [trial], defaultDays: 3, now }).map((item) => item.identifier);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('kimlik sahipliği ve ertele', () => {
  it('yalnızca yenileme ve deneme kimliklerini planlayıcıya ait sayar; ertelenenleri değil', () => {
    expect(isPlannedIdentifier('st:r|sub|3|2026-10-17')).toBe(true);
    expect(isPlannedIdentifier('st:t|sub|1|2026-10-31')).toBe(true);
    expect(isPlannedIdentifier(`${SNOOZE_IDENTIFIER_PREFIX}1700000000000`)).toBe(false);
    expect(isPlannedIdentifier('baska-uygulama')).toBe(false);
  });

  it('ertele süresi 30 dakikadır', () => {
    expect(SNOOZE_MINUTES).toBe(30);
  });
});

describe('saat dilimi değişikliği', () => {
  it('ilk kez (kayıt yok) ve farklı değerde değişmiş sayılır; aynıysa değil', () => {
    expect(timezoneChanged(null, 'Europe/Istanbul')).toBe(true);
    expect(timezoneChanged('Europe/Istanbul', 'Europe/London')).toBe(true);
    expect(timezoneChanged('Europe/Istanbul', 'Europe/Istanbul')).toBe(false);
  });
});
