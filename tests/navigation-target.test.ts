import { expect, it } from 'vitest';
import { safeReturnTo } from '../apps/web/src/lib/navigation';
import { answerStatus, independentlyMastered } from '../apps/web/src/lib/answer-status';

it('preserves local return context and rejects normalized external/account targets', () => {
  const target = '/practice/topics/u1-remainder?question=u1-05#main';
  expect(safeReturnTo(target)).toBe(target);
  for (const value of [
    null,
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/%5cexample.com',
    '/%09/example.com',
    '/account',
    '/%61ccount?returnTo=/',
    '/%ZZ',
  ]) {
    expect(safeReturnTo(value), String(value)).toBe('/');
  }
});
it('distinguishes latest independent mastery from historic first-attempt and later help', () => {
  const corrected = { correct: true, needsReview: false, independentCorrect: false };
  expect(independentlyMastered(corrected)).toBe(true);
  expect(answerStatus(corrected)).toBe('独立答对');
  const afterHelp = { ...corrected, needsReview: true };
  expect(answerStatus(afterHelp, { correct: true, assisted: false })).toBe('待复习');
  expect(answerStatus(afterHelp, { correct: true, assisted: true })).toBe('借助方法答对');
  const needsReviewAgain = { ...corrected, needsReview: true, independentCorrect: true };
  expect(independentlyMastered(needsReviewAgain)).toBe(false);
});
