import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { practice, questions, publicQuestion } from '@mathstudy/content';
import { app } from '../apps/web/worker';

it('classifies usable questions without selected duplicates or incomplete source material', () => {
  const ids = new Set(practice.topics.flatMap((t) => t.questionIds));
  expect(ids.size).toBe(638);
  expect(ids.has('full-p15-s1-q2')).toBe(true);
  expect(ids.has('full-p16-s4-q3-1')).toBe(false);
  const keys = new Set<string>();
  for (const q of questions.filter((q) => ids.has(q.id))) {
    expect(q.sourceIssue).toBeUndefined();
    expect(!q.sources?.length || q.id.startsWith('full-')).toBe(true);
    const key = JSON.stringify([
      q.unitId,
      q.type,
      q.stem,
      q.expected,
      q.fields.map((f) => f.label),
    ]);
    expect(keys.has(key), q.id).toBe(false);
    keys.add(key);
  }
});

it('uses the same difficulty and type filters in category counts, practice rounds and the bank', async () => {
  const query = '?difficulty=challenge&type=application';
  const { data: catalog } = await (await app.request(`/api/v1/practice${query}`)).json();
  expect(catalog.papers).toEqual([]);
  for (const topic of catalog.topics) {
    const response = await app.request(`/api/v1/practice/topics/${topic.id}${query}`);
    const { data } = await response.json();
    expect(data.items.map((q: { id: string }) => q.id)).toEqual(topic.questionIds);
    expect(
      data.items.every(
        (q: { type: string; difficulty: string }) =>
          q.type === 'application' && q.difficulty === 'challenge',
      ),
    ).toBe(true);
  }
  for (const path of ['/practice?type=invalid', '/practice/topics/u2-grid?difficulty=invalid'])
    expect((await app.request(`/api/v1${path}`)).status).toBe(400);
});

it('keeps old question deep links usable while preventing paper browsing and scan requests', async () => {
  const response = await app.request('/api/v1/questions/p15-draw');
  const { data } = await response.json();
  expect(data.items[0].id).toBe('p15-draw');
  expect(data.items[0]).not.toHaveProperty('sources');
  const { data: history } = await (await app.request('/api/v1/questions?scope=history')).json();
  expect(history.items).toHaveLength(797);
  expect(history.items.some((q: { id: string }) => q.id === 'p15-draw')).toBe(true);
  expect((await app.request('/api/v1/practice/papers/P15')).status).toBe(404);
  expect((await app.request('/papers/P15/1.webp')).status).toBe(404);
});

it('ships vector drawings with no embedded source images, external resources or source numbering', () => {
  for (const q of questions.filter((q) => q.id.startsWith('full-'))) {
    expect(publicQuestion(q)).not.toHaveProperty('sources');
    expect(q.title).not.toMatch(/^[一二三四五六七八九十]\d+ · /);
    const assets = [
      q.promptImage?.src,
      ...(q.explanation.visual?.stages ?? []).filter((s) => s.kind === 'image').map((s) => s.image),
    ].filter(Boolean) as string[];
    for (const path of assets) {
      expect(path).toMatch(/^\/figures\/.*\.svg$/);
      const svg = readFileSync(`apps/web/public${path}`, 'utf8');
      expect(svg).not.toMatch(
        /<image|data:image|<script|href\s*=|https?:\/\/(?!www\.w3\.org\/2000\/svg)/,
      );
    }
  }
});

it('checks the actual redrawn half-grid polygons independently against the area answers', () => {
  const q = questions.find((q) => q.id === 'full-p15-s1-q2')!;
  const svg = readFileSync(`apps/web/public${q.promptImage!.src}`, 'utf8');
  const areas = [...svg.matchAll(/<polygon points="([^"]+)"/g)].map((m) => {
    const points = m[1].split(' ').map((p) => p.split(',').map(Number));
    return (
      Math.abs(
        points.reduce((sum, p, i) => {
          const next = points[(i + 1) % points.length];
          return sum + p[0] * next[1] - next[0] * p[1];
        }, 0),
      ) /
      2 /
      (24 * 24)
    );
  });
  expect(areas).toEqual([1, 4, 1, 7, 8]);
  expect(areas.slice(0, 3).reduce((a, b) => a + b)).toBe(Number(q.expected.a1));
  expect(areas[3]).toBe(Number(q.expected.a2));
  expect(areas[4]).toBe(Number(q.expected.a3));
});

it('has exactly one triangle with two equal shorter sides in the redrawn choice question', () => {
  const q = questions.find((q) => q.id === 'full-p16-s2-q4')!;
  const svg = readFileSync(`apps/web/public${q.promptImage!.src}`, 'utf8');
  const matches = [...svg.matchAll(/<polygon points="([^"]+)"/g)].map((m) => {
    const points = m[1].split(' ').map((p) => p.split(',').map(Number));
    const sides = points
      .map((p, i) => {
        const next = points[(i + 1) % 3];
        return (p[0] - next[0]) ** 2 + (p[1] - next[1]) ** 2;
      })
      .sort((a, b) => a - b);
    return sides[0] === sides[1] && sides[1] < sides[2];
  });
  expect(matches).toEqual([false, false, false, true]);
  expect(q.expected.value).toBe('3');
});
