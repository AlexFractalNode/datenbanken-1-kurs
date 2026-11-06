import { describe, expect, it } from 'vitest';
import type { FsrsCard } from '../src/lib/progress';
import { GRADES, isDue, loadSrs } from '../src/lib/srs';

const NOW = new Date('2026-11-06T10:00:00.000Z');
const LATER = new Date('2026-11-20T10:00:00.000Z');

describe('srs with the real ts-fsrs scheduler (FSRS-7)', () => {
  it('reviews a new card and stores serialisable FSRS-7 fields', async () => {
    const srs = await loadSrs();
    const card = srs.review('t04-c001', undefined, 'good', NOW);
    expect(Date.parse(card.dueAt)).toBeGreaterThan(NOW.getTime());
    expect(card.lastReviewAt).toBe(NOW.toISOString());
    expect(card).toMatchObject({ reps: 1, lapses: 0, cardId: 't04-c001', scheduleStatus: expect.any(String) });
    expect(typeof card.stabilityFast).toBe('number');
    // survives a JSON round trip (localStorage)
    const stored = JSON.parse(JSON.stringify(card)) as FsrsCard;
    expect(isDue(stored, NOW)).toBe(false);
    const again = srs.review('t04-c001', stored, 'good', LATER);
    expect(again.reps).toBe(2);
    expect(Date.parse(again.dueAt)).toBeGreaterThan(LATER.getTime());
  });

  it('previews a due date for every grade', async () => {
    const srs = await loadSrs();
    const preview = srs.preview('t04-c001', undefined, NOW);
    for (const g of GRADES) expect(preview[g]).toBeInstanceOf(Date);
    expect(preview.easy.getTime()).toBeGreaterThanOrEqual(preview.again.getTime());
  });

  it('falls back to a new card if a stored card lacks fields ts-fsrs needs', async () => {
    const srs = await loadSrs();
    const full = srs.review('t04-c002', undefined, 'good', NOW);
    const { stabilityFast: _f, scheduleStatus: _s, ...broken } = full;
    const brokenCard = broken as FsrsCard;
    expect(() => srs.review('t04-c002', brokenCard, 'good', LATER)).not.toThrow();
    const reviewed = srs.review('t04-c002', brokenCard, 'good', LATER);
    expect(reviewed.reps).toBe(1);
    expect(reviewed.lastReviewAt).toBe(LATER.toISOString());
    expect(() => srs.preview('t04-c002', brokenCard, LATER)).not.toThrow();
    const preview = srs.preview('t04-c002', brokenCard, LATER);
    for (const g of GRADES) expect(preview[g]).toBeInstanceOf(Date);
  });
});
