import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../apps/web/worker';
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
    async register(email = 'one@example.invalid') {
      const response = await this.call('/api/auth/sign-up/email', {
        email,
        password: 'Test-only-password-2026!',
        name: '学习测试',
      });
      expect(response.status, await response.clone().text()).toBe(200);
      const body = await response.json();
      userId = body.user.id;
      return userId;
    },
    async login(email = 'one@example.invalid') {
      const response = await this.call('/api/auth/sign-in/email', {
        email,
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
  it('limits repeated login attempts by IP and rejects invalid registration fields', async () => {
    const a = device('192.0.2.90');
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++)
      statuses.push(
        (
          await a.call('/api/auth/sign-in/email', {
            email: 'absent@example.invalid',
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
    ).toBe(400);
  });
  it('rejects tampered and expired sessions and sets protected cookies on HTTPS', async () => {
    const response = await app.request(
      'https://mathstudy.windssea526.workers.dev/api/auth/sign-up/email',
      {
        method: 'POST',
        headers: {
          Origin: 'https://mathstudy.windssea526.workers.dev',
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.0.2.80',
        },
        body: JSON.stringify({
          name: '安全验收',
          email: 'secure@example.invalid',
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
    await a.register();
    const key = [...a.cookies.keys()].find((k) => k.includes('session_token'))!;
    const original = a.cookies.get(key)!;
    a.cookies.set(key, original + 'tampered');
    expect((await a.call('/api/v1/me/progress')).status).toBe(401);
    a.cookies.set(key, original);
    database.sqlite.prepare('UPDATE session SET expiresAt=?').run(0);
    expect((await a.call('/api/v1/me/progress')).status).toBe(401);
  });
  it('registers, hashes passwords, signs in a second device and revokes only the signed-out session', async () => {
    const a = device(),
      b = device('192.0.2.2');
    const id = await a.register();
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
    await a.register();
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
    await a.register();
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
    const aId = await a.register();
    const bId = await b.register('two@example.invalid');
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
    await a.register();
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
    await a.register();
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
