/** The look back at the period just ended, shown on Today for the first days of a new one. */
import { isReviewTime, periodReview } from '@/lib/review';
import { en } from '@/i18n/locales/en';
import { fr } from '@/i18n/locales/fr';
import { it as itLocale } from '@/i18n/locales/it';
import type { MonthStats } from '@/types';

const stats = (start: string, end: string, expenses: number, income: number, byCategory: [string | null, number][]): MonthStats => ({
  month: start.slice(0, 7), period: { start, end }, expenses, income, byCategory: byCategory.map(([categoryId, total]) => ({ categoryId, total, count: 1 })),
});

describe('when the look back shows', () => {
  it('for the first five days of a new period only', () => {
    const current = { start: '2026-10-01', end: '2026-10-31' };
    expect(isReviewTime(current, '2026-10-01')).toBe(true);
    expect(isReviewTime(current, '2026-10-05')).toBe(true);
    expect(isReviewTime(current, '2026-10-06')).toBe(false);
  });
});

describe('what it says', () => {
  const sept = stats('2026-09-01', '2026-09-30', 2140, 2400, [['groceries', 410], ['dining', 320], ['transport', 180], ['shopping', 90]]);
  const aug = stats('2026-08-01', '2026-08-31', 2320, 2400, [['groceries', 470], ['dining', 318], ['transport', 120]]);
  it('compares the whole period with the one before, and the three biggest categories', () => {
    const r = periodReview(sept, aug)!;
    expect(r).toMatchObject({ spent: 2140, previousSpent: 2320, change: 'less', income: 2400, kept: 260 });
    expect(r.rows).toEqual([
      { categoryId: 'groceries', total: 410, previous: 470, change: 'less' },
      { categoryId: 'dining', total: 320, previous: 318, change: 'same' },
      { categoryId: 'transport', total: 180, previous: 120, change: 'more' },
    ]);
  });
  it('has nothing to compare in the first period', () => {
    const r = periodReview(sept, null)!;
    expect(r.change).toBe('first');
    expect(r.rows.every((x) => x.change === 'first')).toBe(true);
  });
  it('says nothing for an empty period, and shows no "kept" without income', () => {
    expect(periodReview(stats('2026-09-01', '2026-09-30', 0, 0, []), aug)).toBeNull();
    expect(periodReview(stats('2026-09-01', '2026-09-30', 300, 0, [['dining', 300]]), aug)!.kept).toBeNull();
  });
  it('reads as key words, in every language the right way round', () => {
    expect(en.s.reviewOut('$2,140', 'less', '$180', en.s.reviewPrev('August'))).toBe('$2,140 out · $180 less than August');
    expect(en.s.reviewIn('$2,400', '$260', false)).toBe('$2,400 in · kept $260');
    expect(en.s.reviewChange('same', '$2')).toBe('about the same');
    expect(fr.s.reviewOut('2 140 €', 'less', '180 €', fr.s.reviewPrev('août'))).toBe('2 140 € dépensés · 180 € de moins qu’en août');
    expect(fr.s.reviewOut('2 140 €', 'more', '180 €', fr.s.reviewPrev(null))).toBe('2 140 € dépensés · 180 € de plus que la période d’avant');
    expect(itLocale.s.reviewOut('2.140 €', 'less', '180 €', itLocale.s.reviewPrev('agosto'))).toBe('2.140 € in uscita · 180 € in meno rispetto ad agosto');
  });
});
