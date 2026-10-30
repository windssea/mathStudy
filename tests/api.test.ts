import { describe, expect, it } from 'vitest';
import { app } from '../apps/web/worker';
import { questions, lessons } from '@mathstudy/content';
const base = '/api/v1';
describe('public course and grading API', () => {
  it.each(['sign-up/email', 'sign-in/email'])(
    'consumes the bounded %s body before rejecting the closed route',
    async (route) => {
      const request = new Request(`http://localhost/api/auth/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': '2' },
        body: '{}',
      });
      const response = await app.request(request);
      expect(response.status).toBe(403);
      expect((await response.json()).code).toBe('REGISTRATION_CLOSED');
      expect(request.bodyUsed).toBe(true);
      expect((await app.request(`${base}/home`)).status).toBe(200);
    },
  );
  it('rejects oversized closed-route bodies before buffering them', async () => {
    const request = new Request('http://localhost/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Length': String(160 * 1024 + 1) },
      body: 'x'.repeat(160 * 1024 + 1),
    });
    const response = await app.request(request);
    expect(response.status).toBe(413);
    expect((await response.json()).error.code).toBe('TOO_LARGE');
    expect(request.bodyUsed).toBe(false);
  });
  it('opens all seven fifth-unit lessons and covers every bank question with no private grading keys', async () => {
    const ids = new Set<string>();
    const fifth = lessons.filter((item) => item.unitId === 'U05');
    expect(fifth).toHaveLength(7);
    for (const lesson of fifth) {
      const response = await app.request(
        `${base}/textbooks/sj-math-g4-upper-2026-v1/lessons/${lesson.id}`,
      );
      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.questions.map((item: { id: string }) => item.id)).toEqual(lesson.questionIds);
      expect(JSON.stringify(data)).not.toContain('"expected"');
      lesson.questionIds.forEach((id) => ids.add(id));
    }
    expect([...ids].sort()).toEqual(
      questions
        .filter((q) => q.unitId === 'U05' && Number(q.id.slice(3)) <= 18)
        .map((q) => q.id)
        .sort(),
    );
  });
  it('opens three fourth-unit lessons with all nine questions and no answer keys', async () => {
    const ids: string[] = [];
    for (const lesson of lessons.filter((item) => item.unitId === 'U04')) {
      const response = await app.request(
        `${base}/textbooks/sj-math-g4-upper-2026-v1/lessons/${lesson.id}`,
      );
      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.questions.map((item: { id: string }) => item.id)).toEqual(lesson.questionIds);
      expect(JSON.stringify(data)).not.toContain('"expected"');
      ids.push(...lesson.questionIds);
    }
    expect(ids.sort()).toEqual(Array.from({ length: 9 }, (_, index) => `u4-0${index + 1}`));
  });
  it('serves the configured textbook and release identity', async () => {
    const r = await app.request(`${base}/home`);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.data.textbook.id).toBe('sj-math-g4-upper-2026-v1');
    expect(b.data.questionCount).toBe(884);
    expect(b.data.availableLessons).toBe(27);
    expect(b.requestId).toBeTruthy();
  });
  it('serves all second-unit lessons and the activity with their existing public bank questions', async () => {
    for (const lesson of lessons.filter((l) => l.unitId === 'U02' || l.unitId === 'A01')) {
      const response = await app.request(
        `${base}/textbooks/sj-math-g4-upper-2026-v1/lessons/${lesson.id}`,
      );
      const b = await response.json();
      expect(response.status).toBe(200);
      expect(b.data.lesson.id).toBe(lesson.id);
      expect(b.data.questions.map((q: { id: string }) => q.id)).toEqual(lesson.questionIds);
      expect(b.data.questions.every((q: { unitId: string }) => q.unitId === 'U02')).toBe(true);
      expect(JSON.stringify(b.data)).not.toContain('expected');
    }
  });
  it('serves all four third-unit lessons with the current question bank', async () => {
    for (const lesson of lessons.filter((l) => l.unitId === 'U03')) {
      const response = await app.request(
        `${base}/textbooks/sj-math-g4-upper-2026-v1/lessons/${lesson.id}`,
      );
      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.questions.map((q: { id: string }) => q.id)).toEqual(lesson.questionIds);
      expect(data.questions.every((q: { unitId: string }) => q.unitId === 'U03')).toBe(true);
      expect(JSON.stringify(data)).not.toContain('"expected"');
    }
  });
  it('does not mix editions or open planned lessons', async () => {
    expect((await app.request(`${base}/textbooks/not-this-book/lessons/U01-L01`)).status).toBe(404);
    expect(
      (await app.request(`${base}/textbooks/sj-math-g4-upper-2026-v1/lessons/U06-L01`)).status,
    ).toBe(404);
  });
  it('filters questions without leaking answer keys', async () => {
    const r = await app.request(`${base}/questions?unit=U02&difficulty=challenge&type=application`);
    const b = await r.json();
    expect(b.data.total).toBe(14);
    for (const q of b.data.items) {
      expect(q).not.toHaveProperty('expected');
      expect(q).not.toHaveProperty('explanation');
    }
    expect((await app.request(`${base}/questions?difficulty=impossible`)).status).toBe(400);
  });
  it('grades every stored answer on the server and returns the matching explanation', async () => {
    for (const q of questions) {
      const response = await app.request(`${base}/questions/${q.id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: q.expected }),
      });
      const b = await response.json();
      if (q.sourceIssue) {
        expect(response.status, q.id).toBe(422);
        expect(b.error.code).toBe('SOURCE_INCOMPLETE');
        continue;
      }
      expect(response.status, q.id).toBe(200);
      expect(b.data.correct, q.id).toBe(true);
      expect(b.data.explanation.answer).toBe(q.explanation.answer);
    }
  });
  it('rejects incomplete, forged extra fields, and malformed submissions', async () => {
    for (const payload of [
      { answers: {} },
      { answers: { quotient: '6' } },
      { answers: { quotient: '6', remainder: '4', score: '1' } },
      { answers: { quotient: '6', remainder: '4' }, correct: true },
    ]) {
      expect(
        (
          await app.request(`${base}/questions/u1-05/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        ).status,
      ).toBe(400);
    }
    expect(
      (await app.request(`${base}/questions/u1-05/check`, { method: 'POST', body: '{bad' })).status,
    ).toBe(400);
  });
  it('returns an incorrect result and a usable explanation for a wrong answer', async () => {
    const r = await app.request(`${base}/questions/u1-05/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: { quotient: '5', remainder: '32' } }),
    });
    const b = await r.json();
    expect(b.data.correct).toBe(false);
    expect(b.data.explanation.steps.length).toBeGreaterThan(0);
  });
  it('rejects cross-origin writes and keeps API 404 responses in JSON', async () => {
    expect(
      (
        await app.request(`${base}/questions/u1-05/explanation`, {
          method: 'POST',
          headers: { Origin: 'https://other.example' },
        })
      ).status,
    ).toBe(403);
    const r = await app.request(`${base}/missing`);
    expect(r.status).toBe(404);
    expect(r.headers.get('Content-Type')).toContain('application/json');
  });
});
