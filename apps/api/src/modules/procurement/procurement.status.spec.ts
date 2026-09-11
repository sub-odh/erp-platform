import {
  addDays,
  guaranteeExpiringSoon,
  tenderEnded,
  tenderUrgency,
} from './procurement.status';

describe('tenderUrgency', () => {
  const today = '2026-09-11';

  it('flags a past submission date as overdue', () => {
    expect(tenderUrgency('2026-09-10', today)).toBe('OVERDUE');
  });

  it('treats today and the next seven days as due soon', () => {
    expect(tenderUrgency(today, today)).toBe('DUE_SOON');
    expect(tenderUrgency('2026-09-18', today)).toBe('DUE_SOON');
  });

  it('treats anything beyond the window as upcoming', () => {
    expect(tenderUrgency('2026-09-19', today)).toBe('UPCOMING');
  });
});

describe('tenderEnded', () => {
  const today = '2026-09-11';

  it('ends a tender once its closing date is past', () => {
    expect(tenderEnded('2026-09-10', today)).toBe(true);
  });

  it('keeps a tender open on and after its closing date', () => {
    expect(tenderEnded(today, today)).toBe(false);
    expect(tenderEnded('2026-09-12', today)).toBe(false);
  });

  it('never ends a tender that has no closing date', () => {
    expect(tenderEnded(null, today)).toBe(false);
  });
});

describe('addDays', () => {
  it('rolls over month boundaries', () => {
    expect(addDays('2026-09-28', 5)).toBe('2026-10-03');
  });
});

describe('guaranteeExpiringSoon', () => {
  it('only counts expiries inside the window', () => {
    expect(guaranteeExpiringSoon('2026-09-20', '2026-09-11')).toBe(true);
    expect(guaranteeExpiringSoon('2026-12-01', '2026-09-11')).toBe(false);
    expect(guaranteeExpiringSoon('2026-09-01', '2026-09-11')).toBe(false);
  });
});
