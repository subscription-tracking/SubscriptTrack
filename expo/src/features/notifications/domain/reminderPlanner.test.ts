import { type SubscriptionRow, subscriptionFromRow, type Subscription } from '../../subscriptions/domain/subscription';
import { civilDate, zoneToday, zonedHourToUtc } from '../../../core/time/calendar';
import { REMINDER_LIMIT, SNOOZE_IDENTIFIER_PREFIX, SNOOZE_MINUTES, isCatchUpIdentifier, isPlannedIdentifier, planReminders, renewalDaysFor, timezoneChanged } from './reminderPlanner';

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
const timeZone = 'Europe/Istanbul';
const now = zonedHourToUtc(civilDate(2026, 10, 9), 8, timeZone);

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
    const [reminder] = planReminders({ active: [sub({})], trials: [], defaultDays: 3, now, timeZone });
    expect(reminder.scheduled).toEqual(zonedHourToUtc(civilDate(2026, 10, 17), 9, timeZone));
    expect(reminder.title).toBe('Netflix');
    expect(reminder.body).toBe('3 gün içinde yenileniyor — 149.99 TRY · 2026-10-20');
    expect(reminder.subscriptionId).toBe('sub-1');
  });

  it('kayıtta kural varsa varsayılanı yok sayar', () => {
    const planned = planReminders({
      active: [sub({ notification_rules: [{ daysBefore: 7, enabled: true }] })],
      trials: [],
      defaultDays: 3,
      now,
      timeZone,
    });
    expect(planned).toHaveLength(1);
    expect(planned[0].scheduled).toEqual(zonedHourToUtc(civilDate(2026, 10, 13), 9, timeZone));
  });

  it('deneme bitişinden 7, 3 ve 1 gün önce planlar', () => {
    const trial = sub({ id: 't', status: 'trial', trial_end_date: '2026-10-30' });
    const planned = planReminders({ active: [], trials: [trial], defaultDays: 3, now, timeZone });
    expect(planned.map((item) => zoneToday(timeZone, item.scheduled).day)).toEqual([23, 27, 29]);
    expect(planned[0].title).toBe('Netflix denemesi sona eriyor');
  });

  it('geçmişte kalan teslimleri eler', () => {
    const planned = planReminders({ active: [sub({ next_renewal_date: '2026-10-10' })], trials: [], defaultDays: 3, now, timeZone });
    // 10 Ekim − 3 = 7 Ekim (geçmiş) elenir.
    expect(planned).toEqual([]);
  });

  it('en fazla limit kadar bildirim tutar ve en yakınları korur', () => {
    const many = Array.from({ length: 80 }, (_, index) =>
      sub({ id: `s-${index}`, next_renewal_date: `2026-${String((index % 9) + 10).padStart(2, '0')}-28`, start_date: '2026-01-01' }),
    );
    const planned = planReminders({ active: many, trials: [], defaultDays: 3, now, timeZone });
    expect(planned.length).toBeLessThanOrEqual(REMINDER_LIMIT);
    const times = planned.map((item) => item.scheduled.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('aynı girdi aynı kimlikleri üretir (tekrar planlamayı önler)', () => {
    const input = { active: [sub({})], trials: [], defaultDays: 3, now, timeZone };
    expect(planReminders(input).map((item) => item.identifier)).toEqual(planReminders(input).map((item) => item.identifier));
  });

  it('kimlikler bildirim türünü ayırır: yenileme ve deneme çakışmaz', () => {
    const renewal = sub({ id: 'x', next_renewal_date: '2026-10-30' });
    const trial = sub({ id: 'x', status: 'trial', trial_end_date: '2026-10-30' });
    const ids = planReminders({ active: [renewal], trials: [trial], defaultDays: 3, now, timeZone }).map((item) => item.identifier);
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

describe('yedek (catch-up) ve gecikme bildirimleri', () => {
  // 9 Ekim 10:00 (İstanbul): bugünkü 09:00 teslimi geçmiş.
  const late = zonedHourToUtc(civilDate(2026, 10, 9), 10, timeZone);
  const base = { trials: [], defaultDays: 3, timeZone };

  it('yenileme bugünse ve saat geçmişse now+60 sn tek seferlik yedek üretir', () => {
    const [reminder] = planReminders({ ...base, active: [sub({ next_renewal_date: '2026-10-09' })], now: late });
    expect(reminder.identifier).toBe('st:c|sub-1|2026-10-09');
    expect(reminder.scheduled).toEqual(new Date(late.getTime() + 60_000));
    expect(reminder.body).toBe('Bugün yenileniyor — 149.99 TRY · 2026-10-09');
    expect(isPlannedIdentifier(reminder.identifier)).toBe(true);
  });

  it('bugün yenilenen ama saati henüz gelmemiş kayıt yedek değil normal 0 günlük bildirim alır', () => {
    const early = planReminders({ ...base, active: [sub({ next_renewal_date: '2026-10-09', notification_rules: [{ daysBefore: 0, enabled: true }] })], now });
    expect(early.map((item) => item.identifier)).toEqual(['st:r|sub-1|0|2026-10-09']);
  });

  it('gecikmiş kayıt için günde bir "Vadesi geçti" bildirimi üretir; sentMarkers varsa üretmez', () => {
    const active = [sub({ next_renewal_date: '2026-10-05' })];
    const [reminder] = planReminders({ ...base, active, now: late });
    expect(reminder.identifier).toBe('st:o|sub-1|2026-10-09');
    expect(reminder.body).toBe('Vadesi geçti — 149.99 TRY · 2026-10-05. Ödemeyi kontrol et.');
    expect(planReminders({ ...base, active, now: late, sentMarkers: new Set([reminder.identifier]) })).toEqual([]);
    // Ertesi gün yeni kimlik: ayrı bir günlük bildirim.
    const nextDay = zonedHourToUtc(civilDate(2026, 10, 10), 10, timeZone);
    expect(planReminders({ ...base, active, now: nextDay, sentMarkers: new Set([reminder.identifier]) })[0].identifier).toBe('st:o|sub-1|2026-10-10');
  });

  it('bugün için gönderilmiş yedek işareti varsa tekrar üretmez', () => {
    const active = [sub({ next_renewal_date: '2026-10-09' })];
    expect(planReminders({ ...base, active, now: late, sentMarkers: new Set(['st:c|sub-1|2026-10-09']) })).toEqual([]);
  });

  it('tüm kuralları kapalı kayıt için yedek üretmez', () => {
    const active = [sub({ next_renewal_date: '2026-10-09', notification_rules: [{ daysBefore: 3, enabled: false }] })];
    expect(planReminders({ ...base, active, now: late })).toEqual([]);
  });

  it('60 sınırında yedekler normal adaylardan önce gelir', () => {
    const normal = Array.from({ length: 70 }, (_, index) => sub({ id: `n-${index}`, next_renewal_date: '2026-10-28' }));
    const planned = planReminders({ ...base, active: [...normal, sub({ id: 'gec', next_renewal_date: '2026-10-01' })], now: late });
    expect(planned).toHaveLength(REMINDER_LIMIT);
    expect(planned[0].identifier).toBe('st:o|gec|2026-10-09');
  });

  it('"bugün" kullanıcının IANA gününe göre belirlenir', () => {
    // 2026-10-09 22:30 UTC: İstanbul'da 10 Ekim 01:30, Londra'da hâlâ 9 Ekim 23:30.
    const instant = new Date('2026-10-09T22:30:00.000Z');
    const active = [sub({ next_renewal_date: '2026-10-09' })];
    const istanbul = planReminders({ ...base, active, now: instant, timeZone: 'Europe/Istanbul' });
    expect(istanbul[0].identifier).toBe('st:o|sub-1|2026-10-10');
    const london = planReminders({ ...base, active, now: instant, timeZone: 'Europe/London' });
    expect(london[0].identifier).toBe('st:c|sub-1|2026-10-09');
  });

  it('yeni önekleri planlayıcıya ait sayar', () => {
    expect(isPlannedIdentifier('st:c|sub|2026-10-09')).toBe(true);
    expect(isPlannedIdentifier('st:o|sub|2026-10-09')).toBe(true);
    expect(isCatchUpIdentifier('st:o|sub|2026-10-09')).toBe(true);
    expect(isCatchUpIdentifier('st:r|sub|3|2026-10-09')).toBe(false);
  });
});
