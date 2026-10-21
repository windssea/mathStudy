import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../apps/web/worker';
import { builtInAccountSeed } from '../apps/web/worker/builtin-provision';
import { testDatabase } from './helpers/d1';
import { editionId, type LearningEvent } from '@mathstudy/contracts';

let database: ReturnType<typeof testDatabase>;
const secret = 'test-secret-only-for-isolated-tests-not-for-production-123456789';
beforeEach(() => {
  database = testDatabase();
});
afterEach(() => {
  database.close();
  vi.restoreAllMocks();
});
function device(ip = '192.0.2.1') {
  const cookies = new Map<string, string>();
  let userId = '';
  return {
    async call(path: string, body?: unknown) {
      const headers = new Headers({
        Origin: 'http://localhost',
        'CF-Connecting-IP': ip,
        'Content-Type': 'application/json',
        Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
      });
      if (userId) headers.set('X-MathStudy-Account', userId);
      const response = await app.request(
        path,
        {
          method: body === undefined ? 'GET' : 'POST',
          headers,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        },
        { DB: database.db, AUTH_SECRET: secret },
      );
      for (const cookie of response.headers.getSetCookie()) {
        const part = cookie.split(';')[0],
          index = part.indexOf('=');
        if (index >= 0) cookies.set(part.slice(0, index), part.slice(index + 1));
      }
      return response;
    },
    async provision(email = 'one@example.invalid') {
      const username = email.split('@')[0];
      database.sqlite.exec(await builtInAccountSeed(username, 'Test-only-password-2026!'));
      await this.login(email);
      return userId;
    },
    async login(email = 'one@example.invalid') {
      const response = await this.call('/api/auth/sign-in/username', {
        username: email.split('@')[0],
        password: 'Test-only-password-2026!',
      });
      expect(response.status, await response.clone().text()).toBe(200);
      userId = (await response.json()).user.id;
    },
    async sync(events: LearningEvent[] = []) {
      const response = await this.call('/api/v1/me/sync', { editionId, events });
      expect(response.status, await response.clone().text()).toBe(200);
      return (await response.json()).data;
    },
    setUser(id: string) {
      userId = id;
    },
    cookies,
  };
}
function event(kind: 'complete' | 'visit', entityId: string, offset = 0): LearningEvent {
  return {
    id: crypto.randomUUID(),
    kind,
    entityId,
    occurredAt: new Date(Date.now() + offset).toISOString(),
  };
}
function attempt(value: string, assisted = false, offset = 0): LearningEvent {
  return {
    id: crypto.randomUUID(),
    kind: 'attempt',
    entityId: 'u2-08',
    occurredAt: new Date(Date.now() + offset).toISOString(),
    answers: { value },
    assisted,
  };
}
describe('account authentication and private D1 learning records', () => {
  it('syncs new topic answers, strict codes and corrections idempotently across devices', async () => {
    const a = device(),
      b = device('192.0.2.2');
    await a.provision();
    await b.login();
    const stamp = Date.now();
    const make = (
      entityId: string,
      answers: Record<string, string>,
      offset: number,
    ): Extract<LearningEvent, { kind: 'attempt' }> => ({
      id: crypto.randomUUID(),
      kind: 'attempt',
      entityId,
      answers,
      assisted: false,
      occurredAt: new Date(stamp + offset).toISOString(),
    });
    const shopping = make('bank-u3-compare-04', { a1: '84', a2: '2', a3: '2' }, 0);
    const wrong = make('bank-u5-codes-02', { a1: '0202706008' }, 10);
    const right = make('bank-u5-codes-02', { a1: '202706008' }, 20);
    const rounding = make('bank-u5-rounding-04', { a1: '1950000', a2: '1954999' }, 30);
    const vehicles = make('bank-u4-budget-05', { a1: '780', a2: '2', a3: '1' }, 40);
    await a.sync([shopping, wrong]);
    const received = (await b.sync()).snapshot;
    expect(received.answers[shopping.entityId]).toMatchObject({
      attemptCount: 1,
      needsReview: false,
    });
    expect(received.answers[wrong.entityId]).toMatchObject({ attemptCount: 1, needsReview: true });
    await b.sync([right, rounding, vehicles]);
    const result = (await a.sync([shopping, wrong, right, rounding, vehicles])).snapshot;
    expect(result.answers[wrong.entityId]).toMatchObject({
      attemptCount: 2,
      wrongCount: 1,
      needsReview: false,
      source: 'verified',
    });
    for (const record of [shopping, rounding, vehicles]) {
      expect(result.answers[record.entityId]).toMatchObject({
        attemptCount: 1,
        needsReview: false,
        source: 'verified',
      });
      expect(result.history.find((row: { id: string }) => row.id === record.id).answers).toEqual(
        record.answers,
      );
    }
  });
  it('persists flexible grid answers and correction history across two authenticated D1 sessions', async () => {
    const a = device(),
      b = device('192.0.2.2');
    await a.provision();
    await b.login();
    const stamp = Date.now();
    const wrong: LearningEvent = {
      id: crypto.randomUUID(),
      kind: 'attempt',
      entityId: 'p15-draw',
      answers: { cells: '0'.repeat(60) },
      assisted: false,
      occurredAt: new Date(stamp).toISOString(),
    };
    const cells = Array.from({ length: 60 }, (_, i) =>
      Math.floor(i / 10) >= 2 && Math.floor(i / 10) < 4 && i % 10 < 9 ? '1' : '0',
    ).join('');
    const right: LearningEvent = {
      ...wrong,
      id: crypto.randomUUID(),
      answers: { cells },
      occurredAt: new Date(stamp + 10).toISOString(),
    };
    await a.sync([wrong]);
    expect((await b.sync()).snapshot.answers['p15-draw'].needsReview).toBe(true);
    await b.sync([right]);
    const result = await a.sync([wrong, right]);
    expect(result.snapshot.answers['p15-draw']).toMatchObject({
      attemptCount: 2,
      wrongCount: 1,
      needsReview: false,
      source: 'verified',
    });
    expect(
      result.snapshot.history.find((r: { id: string }) => r.id === right.id).answers.cells,
    ).toBe(cells);
  });
  it('syncs seven fifth-unit lessons, rounding corrections and new encoding answers across devices', async () => {
    const a = device(),
      b = device('192.0.2.2');
    await a.provision();
    await b.login();
    const completions = Array.from({ length: 7 }, (_, index) =>
      event('complete', `U05-L0${index + 1}`),
    );
    const wrong = { ...attempt('360000', false, 10), entityId: 'u5-07' };
    const right = { ...attempt('355000', false, 20), entityId: 'u5-07' };
    const encoding = { ...attempt('30', false, 30), entityId: 'u5-16' };
    await a.sync([event('complete', 'U04-L03'), ...completions, wrong]);
    expect((await b.sync()).snapshot.answers['u5-07'].needsReview).toBe(true);
    await b.sync([right, encoding]);
    const result = await a.sync([wrong, right, encoding]);
    expect(result.snapshot.completed).toContain('U04-L03');
    for (const completion of completions)
      expect(result.snapshot.completed).toContain(completion.entityId);
    expect(result.snapshot.answers['u5-07']).toMatchObject({
      attemptCount: 2,
      wrongCount: 1,
      needsReview: false,
      source: 'verified',
    });
    expect(result.snapshot.answers['u5-16']).toMatchObject({
      attemptCount: 1,
      needsReview: false,
      source: 'verified',
    });
  });
  it('syncs fourth-unit completion and wrong-answer correction across two sessions without losing earlier units', async () => {
    const a = device(),
      b = device('192.0.2.2');
    await a.provision();
    await b.login();
    const completed = ['U03-L02', 'U04-L01', 'U04-L02', 'U04-L03'].map((id) =>
      event('complete', id),
    );
    const wrong = { ...attempt('0', false, 10), entityId: 'u4-07' };
    const right = { ...attempt('6', false, 20), entityId: 'u4-07' };
    await a.sync([...completed, wrong]);
    expect((await b.sync()).snapshot.answers['u4-07'].needsReview).toBe(true);
    await b.sync([right]);
    const result = await a.sync([wrong, right]);
    expect(result.snapshot.completed.sort()).toEqual(['U03-L02', 'U04-L01', 'U04-L02', 'U04-L03']);
    expect(result.snapshot.answers['u4-07']).toMatchObject({
      attemptCount: 2,
      wrongCount: 1,
      needsReview: false,
      source: 'verified',
    });
  });
  it('closes registration and email login, preserves provisioning, and rejects disabled built-in sessions', async () => {
    const a = device();
    expect(
      (
        await a.call('/api/auth/sign-up/email', {
          email: 'new@example.invalid',
          password: 'Test-only-password-2026!',
          name: '新用户',
        })
      ).status,
    ).toBe(403);
    expect(database.sqlite.prepare('SELECT count(*) AS n FROM user').get()!.n).toBe(0);
    const id = await a.provision();
    database.sqlite.exec(await builtInAccountSeed('one', 'Another-test-password-2026!'));
    await device('192.0.2.9').login();
    expect(
      (
        await a.call('/api/auth/sign-in/email', {
          email: 'one@mathstudy.internal',
          password: 'Test-only-password-2026!',
        })
      ).status,
    ).toBe(403);
    database.sqlite.prepare('UPDATE built_in_accounts SET enabled=0 WHERE user_id=?').run(id);
    expect((await a.call('/api/v1/me/progress')).status).toBe(401);
    expect(
      (
        await a.call('/api/auth/sign-in/username', {
          username: 'one',
          password: 'Test-only-password-2026!',
        })
      ).status,
    ).toBe(401);
  });
  it('syncs all third-unit lesson completions and grades its questions through the same account events', async () => {
    const a = device(),
      b = device('192.0.2.2');
    await a.provision();
    await b.login();
    const events: LearningEvent[] = ['U03-L01', 'U03-L02', 'U03-L03', 'U03-L04'].map((id) =>
      event('complete', id),
    );
    events.push(
      { ...attempt('0', false, 10), entityId: 'u3-07' },
      { ...attempt('80', false, 20), entityId: 'u3-07' },
    );
    await a.sync(events);
    const data = await b.sync();
    expect(data.snapshot.completed.sort()).toEqual(['U03-L01', 'U03-L02', 'U03-L03', 'U03-L04']);
    expect(data.snapshot.answers['u3-07']).toMatchObject({
      attemptCount: 2,
      wrongCount: 1,
      needsReview: false,
      source: 'verified',
    });
  });
  it('forwards refreshed session cookies to the browser during ordinary account checks', async () => {
    const a = device();
    await a.provision();
    database.sqlite
      .prepare('UPDATE session SET expiresAt=?,updatedAt=?')
      .run(Date.now() + 3 * 86400000, Date.now() - 4 * 86400000);
    const response = await a.call('/api/v1/account');
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().join(';')).toContain('mathstudy.session_token');
    expect(
      new Date(
        String(database.sqlite.prepare('SELECT expiresAt FROM session').get()!.expiresAt),
      ).getTime(),
    ).toBeGreaterThan(Date.now() + 6 * 86400000);
  });
  it('limits repeated username login attempts by IP and rejects public registration', async () => {
    const a = device('192.0.2.90');
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++)
      statuses.push(
        (
          await a.call('/api/auth/sign-in/username', {
            username: 'absent',
            password: 'Wrong-password-2026!',
          })
        ).status,
      );
    expect(statuses).toContain(429);
    expect(
      (
        await device('192.0.2.91').call('/api/auth/sign-up/email', {
          name: '长'.repeat(41),
          email: 'new@example.invalid',
          password: 'Test-only-password-2026!',
        })
      ).status,
    ).toBe(403);
  });
  it('rejects tampered and expired sessions and sets protected cookies on HTTPS', async () => {
    database.sqlite.exec(await builtInAccountSeed('secure', 'Test-only-password-2026!'));
    const response = await app.request(
      'https://mathstudy.windssea526.workers.dev/api/auth/sign-in/username',
      {
        method: 'POST',
        headers: {
          Origin: 'https://mathstudy.windssea526.workers.dev',
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.0.2.80',
        },
        body: JSON.stringify({
          name: '安全验收',
          username: 'secure',
          password: 'Test-only-password-2026!',
        }),
      },
      { DB: database.db, AUTH_SECRET: secret },
    );
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().join(';')).toMatch(/Secure/);
    expect(response.headers.getSetCookie().join(';')).toMatch(/HttpOnly/);
    expect(response.headers.getSetCookie().join(';')).toMatch(/SameSite=Lax/);
    const a = device();
    await a.provision();
    const key = [...a.cookies.keys()].find((k) => k.includes('session_token'))!;
    const original = a.cookies.get(key)!;
    a.cookies.set(key, original + 'tampered');
    expect((await a.call('/api/v1/me/progress')).status).toBe(401);
    a.cookies.set(key, original);
    database.sqlite.prepare('UPDATE session SET expiresAt=?').run(0);
    expect((await a.call('/api/v1/me/progress')).status).toBe(401);
  });
  it('provisions hashed passwords, signs in a second device and revokes only the signed-out session', async () => {
    const a = device(),
      b = device('192.0.2.2');
    const id = await a.provision();
    await b.login();
    const account = await a.call('/api/v1/account');
    expect((await account.json()).data.user.id).toBe(id);
    const password = database.sqlite.prepare('SELECT password FROM account').get()!.password;
    expect(password).not.toBe('Test-only-password-2026!');
    expect(String(password).length).toBeGreaterThan(64);
    expect(a.cookies.size).toBeGreaterThan(0);
    expect((await a.call('/api/auth/sign-out', {})).status).toBe(200);
    expect((await a.call('/api/v1/me/progress')).status).toBe(401);
    expect((await b.call('/api/v1/me/progress')).status).toBe(200);
  });
  it('merges two devices without losing completions, recent lessons or repeated attempts', async () => {
    const a = device(),
      b = device('192.0.2.2');
    await a.provision();
    await b.login();
    await Promise.all([
      a.sync([event('complete', 'U01-L01'), event('visit', 'U02-L02', 10)]),
      b.sync([event('complete', 'U02-L05'), event('visit', 'U02-L05', 20)]),
    ]);
    const wrong = attempt('100', false, 30),
      right = attempt('132', false, 40);
    await a.sync([wrong]);
    await b.sync([right]);
    const data = await a.sync([wrong, right]);
    expect(new Set(data.snapshot.completed)).toEqual(new Set(['U01-L01', 'U02-L05']));
    expect(data.snapshot.lastLessonId).toBe('U02-L05');
    expect(data.snapshot.answers['u2-08']).toMatchObject({
      correct: true,
      attemptCount: 2,
      wrongCount: 1,
      needsReview: false,
      everWrong: true,
      independentCorrect: false,
    });
    expect(data.snapshot.history).toHaveLength(2);
    expect(
      database.sqlite
        .prepare("SELECT count(*) AS n FROM learning_events WHERE kind='attempt'")
        .get()?.n,
    ).toBe(2);
  });
  it('regrades uploaded answers, keeps assisted correct answers pending and tracks independent corrections', async () => {
    const a = device();
    await a.provision();
    const bad = attempt('0', false, 10);
    let result = await a.sync([bad]);
    expect(result.snapshot.answers['u2-08'].correct).toBe(false);
    result = await a.sync([attempt('132', true, 20)]);
    expect(result.snapshot.answers['u2-08'].needsReview).toBe(true);
    result = await a.sync([attempt('132', false, 30)]);
    expect(result.snapshot.answers['u2-08'].needsReview).toBe(false);
    expect(result.snapshot.history[0].source).toBe('verified');
  });
  it('isolates accounts and rejects a stale account header, forged scores, invalid content and foreign origins', async () => {
    const a = device(),
      b = device('192.0.2.2');
    const aId = await a.provision();
    const bId = await b.provision('two@example.invalid');
    await a.sync([event('complete', 'U02-L05')]);
    expect((await b.sync()).snapshot.completed).toEqual([]);
    b.setUser(aId);
    expect(
      (await b.call('/api/v1/me/sync', { editionId, events: [event('complete', 'U01-L01')] }))
        .status,
    ).toBe(409);
    b.setUser(bId);
    for (const events of [
      [{ ...attempt('0'), correct: true }],
      [event('complete', 'U99-L99')],
      [{ ...attempt('132'), answers: { value: '132', score: '1' } }],
    ])
      expect((await a.call('/api/v1/me/sync', { editionId, events })).status).toBe(400);
    expect(
      (
        await app.request(
          '/api/v1/me/sync',
          {
            method: 'POST',
            headers: { Origin: 'https://other.invalid', 'Content-Type': 'application/json' },
            body: JSON.stringify({ editionId, events: [] }),
          },
          { DB: database.db, AUTH_SECRET: secret },
        )
      ).status,
    ).toBe(403);
  });
  it('imports legacy records with provenance and never inserts them twice', async () => {
    const a = device();
    await a.provision();
    const legacy: LearningEvent = {
      id: 'legacy:device-one:u1-01',
      kind: 'legacy',
      entityId: 'u1-01',
      occurredAt: '2026-10-01T00:00:00.000Z',
      correct: false,
      revealed: false,
      independentCorrect: false,
    };
    await a.sync([legacy]);
    const result = await a.sync([legacy]);
    expect(result.snapshot.answers['u1-01']).toMatchObject({ source: 'imported', wrongCount: 1 });
    expect(result.snapshot.history).toHaveLength(1);
  });
  it('records authenticated grading once even if the same event is later retried in the sync queue', async () => {
    const a = device();
    await a.provision();
    const e = attempt('132') as Extract<LearningEvent, { kind: 'attempt' }>;
    const response = await a.call('/api/v1/questions/u2-08/check', {
      answers: e.answers,
      attemptId: e.id,
      occurredAt: e.occurredAt,
      assisted: e.assisted,
    });
    expect(response.status, await response.clone().text()).toBe(200);
    expect((await response.json()).data.correct).toBe(true);
    const result = await a.sync([e]);
    expect(result.snapshot.answers['u2-08'].attemptCount).toBe(1);
  });
});
it('syncs full-paper alternatives and actual source drawings between devices, and keeps self-checks assisted', async () => {
  const a = device(),
    b = device('192.0.2.2');
  await a.provision();
  await b.login();
  const make = (
    entityId: string,
    answers: Record<string, string>,
    offset: number,
  ): LearningEvent => ({
    kind: 'attempt',
    id: crypto.randomUUID(),
    entityId,
    answers,
    assisted: false,
    occurredAt: new Date(Date.now() + offset).toISOString(),
  });
  const setAnswer = make('full-p04-s2-q5', { a1: '6、5、4' }, 10);
  await a.sync([setAnswer]);
  let remote = await b.sync();
  expect(remote.snapshot.answers[setAnswer.entityId]).toMatchObject({
    correct: true,
    independentCorrect: true,
    attemptCount: 1,
  });
  const gridId = 'full-p18-q23-2';
  const wrong = make(gridId, { cells: '0'.repeat(60) }, 20);
  await a.sync([wrong]);
  expect((await b.sync()).snapshot.answers[gridId].needsReview).toBe(true);
  const right = make(
    gridId,
    {
      cells: Array.from({ length: 60 }, (_, i) =>
        3 <= Math.floor(i / 10) && Math.floor(i / 10) <= 4 && 1 <= i % 10 && i % 10 <= 7
          ? '1'
          : '0',
      ).join(''),
    },
    30,
  );
  await b.sync([right]);
  remote = await a.sync([right]);
  expect(remote.snapshot.answers[gridId]).toMatchObject({
    correct: true,
    attemptCount: 2,
    wrongCount: 1,
    needsReview: false,
    independentCorrect: false,
  });
  await a.sync([make('full-p15-s4-q1', { review: '已核对' }, 40)]);
  remote = await b.sync();
  expect(remote.snapshot.answers['full-p15-s4-q1']).toMatchObject({
    correct: true,
    independentCorrect: false,
    needsReview: true,
  });
  const before = remote.snapshot.history.length;
  expect(
    (await a.call('/api/v1/questions/full-p16-s4-q3-1/check', { answers: { review: '已核对' } }))
      .status,
  ).toBe(422);
  expect((await b.sync()).snapshot.history).toHaveLength(before);
});
