// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { editionId, releaseId } from '@mathstudy/contracts';
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('retains third-unit legacy records and accepts fourth-unit progress after the release changes', async () => {
  vi.resetModules();
  const old = `mathstudy:${editionId}:preview-2026-10-u03-r1`;
  localStorage.setItem(
    old,
    JSON.stringify({ version: 1, completed: ['U03-L03'], lastLessonId: 'U03-L03', answers: {} }),
  );
  const { useProgress, visitLesson, completeLesson } = await import('../apps/web/src/lib/progress');
  const state = renderHook(() => useProgress());
  expect(state.result.current.completed).toContain('U03-L03');
  act(() => {
    visitLesson('U04-L02');
    completeLesson('U04-L02');
  });
  expect(state.result.current.completed).toEqual(['U03-L03', 'U04-L02']);
  expect(state.result.current.lastLessonId).toBe('U04-L02');
});
it('carries first-unit progress into the new release and persists second-unit/activity records', async () => {
  vi.resetModules();
  const old = `mathstudy:${editionId}:preview-2026-10-u01-r1`,
    current = `mathstudy:${editionId}:${releaseId}`;
  const stored = JSON.stringify({
    version: 1,
    lastLessonId: 'U01-L04',
    completed: ['U01-L01', 'U01-L01', 'U99-L99'],
    answers: { 'u1-01': { correct: true, revealed: false, date: '2026-10-19' } },
  });
  localStorage.setItem(old, stored);
  const { useProgress, visitLesson, completeLesson } = await import('../apps/web/src/lib/progress');
  const state = renderHook(() => useProgress());
  expect(state.result.current.completed).toEqual(['U01-L01']);
  expect(state.result.current.lastLessonId).toBe('U01-L04');
  expect(state.result.current.answers['u1-01'].independentCorrect).toBe(true);
  act(() => {
    visitLesson('U02-L05');
    completeLesson('U02-L05');
    completeLesson('A01-L01');
  });
  expect(JSON.parse(localStorage.getItem(current)!).completed).toEqual([
    'U01-L01',
    'U02-L05',
    'A01-L01',
  ]);
  expect(localStorage.getItem(old)).toBe(stored);
  act(() =>
    window.dispatchEvent(
      new StorageEvent('storage', { key: current, newValue: localStorage.getItem(current) }),
    ),
  );
  expect(state.result.current.completed).toContain('A01-L01');
});
