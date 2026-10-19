// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  emptyLearning,
  foldLearningEvents,
  type AcceptedLearningEvent,
  type PublicUser,
} from '@mathstudy/contracts';

let user: PublicUser | null;
let offline: boolean;
let uploaded: Map<string, Map<string, AcceptedLearningEvent>>;
const alice = { id: 'alice', name: '甲', email: 'a@example.invalid' };
const bob = { id: 'bob', name: '乙', email: 'b@example.invalid' };
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  user = null;
  offline = false;
  uploaded = new Map();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      if (path === '/api/v1/account') return response({ user, available: true });
      if (path === '/api/auth/sign-out') {
        user = null;
        return response({});
      }
      if (path !== '/api/v1/me/sync') throw new Error(`Unexpected request: ${path}`);
      if (offline) throw new TypeError('Network unavailable');
      const owner = new Headers(init?.headers).get('X-MathStudy-Account');
      if (!user || user.id !== owner) return response({}, 409);
      const events = JSON.parse(String(init?.body)).events as AcceptedLearningEvent[];
      const all = uploaded.get(owner!) ?? new Map<string, AcceptedLearningEvent>();
      for (const event of events)
        if (!all.has(event.id))
          all.set(event.id, {
            ...event,
            ...(event.kind === 'attempt'
              ? { correct: event.answers.value === '132', verified: true }
              : {}),
          });
      uploaded.set(owner!, all);
      return response({
        acknowledged: events.map((e) => e.id),
        snapshot: foldLearningEvents([...all.values()]),
        serverTime: new Date().toISOString(),
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

it('keeps guests separate, explicitly imports once, and retains the guest copy after logout', async () => {
  const store = await import('../apps/web/src/lib/progress');
  store.completeLesson('U02-L05');
  store.recordAnswer('u1-01', false, false);
  const progress = renderHook(store.useProgress);
  user = alice;
  await act(() => store.refreshAccount());
  expect(progress.result.current.completed).toEqual([]);
  expect(store.guestImportInfo()).toMatchObject({ lessons: 1, questions: 1 });
  await act(() => store.importGuest());
  expect(progress.result.current.completed).toEqual(['U02-L05']);
  expect(store.guestImportInfo().events).toBe(0);
  await act(() => store.importGuest());
  expect(uploaded.get(alice.id)!.size).toBe(2);
  await act(() => store.signOut());
  expect(progress.result.current.answers['u1-01'].needsReview).toBe(true);
});

it('persists failed uploads through reload and acknowledges each event only once after reconnect', async () => {
  let store = await import('../apps/web/src/lib/progress');
  user = alice;
  await store.refreshAccount();
  offline = true;
  store.completeLesson('U02-L02');
  const event = store.makeLearningEvent('attempt', 'u2-08', { value: '132' }, false);
  store.recordAnswer('u2-08', true, false, event);
  await expect(store.synchronize()).rejects.toThrow();
  const pendingKeys = Object.keys(localStorage).filter((k) => k.includes(':alice:event:'));
  expect(pendingKeys).toHaveLength(2);
  vi.resetModules();
  store = await import('../apps/web/src/lib/progress');
  await store.refreshAccount();
  const account = renderHook(store.useAccount),
    progress = renderHook(store.useProgress);
  expect(account.result.current.pending).toBe(2);
  expect(progress.result.current.completed).toEqual(['U02-L02']);
  offline = false;
  await act(() => store.synchronize());
  expect(account.result.current.pending).toBe(0);
  expect(progress.result.current.answers['u2-08']).toMatchObject({
    attemptCount: 1,
    source: 'verified',
  });
  expect(pendingKeys.every((key) => localStorage.getItem(key) === null)).toBe(true);
  await act(() => store.synchronize());
  expect(uploaded.get(alice.id)!.size).toBe(2);
});

it('does not display or upload another account’s queued work when sessions change', async () => {
  const store = await import('../apps/web/src/lib/progress');
  user = alice;
  await store.refreshAccount();
  offline = true;
  store.completeLesson('U01-L01');
  const owner = store.currentLearningOwner();
  await expect(store.synchronize()).rejects.toThrow();
  offline = false;
  user = bob;
  await store.refreshAccount();
  const state = renderHook(store.useProgress);
  expect(state.result.current.completed).toEqual([]);
  // A grading response arriving after an account switch must retain its original owner.
  act(() =>
    store.recordAnswer(
      'u2-08',
      false,
      false,
      store.makeLearningEvent('attempt', 'u2-08', { value: '0' }, false),
      owner,
    ),
  );
  await act(() => store.synchronize());
  expect(uploaded.get(bob.id)!.size).toBe(0);
  expect(state.result.current.answers).toEqual({});
  user = alice;
  await act(() => store.refreshAccount());
  expect(state.result.current.completed).toEqual(['U01-L01']);
  expect(state.result.current.answers['u2-08'].needsReview).toBe(true);
  expect(uploaded.get(alice.id)!.size).toBe(2);
});

it('clears personal views when an expired session is detected and leaves the account outbox intact', async () => {
  const store = await import('../apps/web/src/lib/progress');
  user = alice;
  await store.refreshAccount();
  store.completeLesson('U02-L01');
  const progress = renderHook(store.useProgress);
  expect(progress.result.current.completed).toEqual(['U02-L01']);
  user = null;
  await act(() => store.refreshAccount());
  expect(progress.result.current).toEqual(emptyLearning());
  expect(Object.keys(localStorage).some((key) => key.includes(':alice:event:'))).toBe(true);
});
