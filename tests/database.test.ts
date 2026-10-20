import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildContentSeed } from '../scripts/lib/d1-seed';
import {
  loadCourseContent,
  type ContentDatabase,
  type D1Statement,
} from '../apps/web/worker/content-repository';
import { app } from '../apps/web/worker';
import { editionId, releaseId } from '@mathstudy/contracts';

class Statement implements D1Statement {
  constructor(
    readonly sql: string,
    readonly values: (string | number | null)[] = [],
  ) {}
  bind(...values: (string | number | null)[]) {
    return new Statement(this.sql, values);
  }
}
let sqlite: DatabaseSync;
const db: ContentDatabase = {
  prepare: (sql) => new Statement(sql),
  async batch<T>(statements: D1Statement[]) {
    return statements.map((statement) => {
      const s = statement as Statement;
      return { results: sqlite.prepare(s.sql).all(...s.values) as T[] };
    });
  },
};
beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  for (const file of ['0001-foundation.sql', '0002-published-content.sql'])
    sqlite.exec(readFileSync(`packages/database/migrations/${file}`, 'utf8'));
  sqlite.exec(buildContentSeed().sql);
});
afterEach(() => {
  sqlite.close();
  vi.restoreAllMocks();
});
describe('Cloudflare D1 content integration', () => {
  it('applies real SQL migrations and repeatedly seeds without duplicate or missing rows', async () => {
    const seed = buildContentSeed();
    sqlite.exec(seed.sql);
    const content = await loadCourseContent(db);
    expect(content.source).toBe('d1');
    expect(content.sourceHash).toBe(seed.sourceHash);
    expect(content.textbook.id).toBe(editionId);
    expect(content.lessons).toHaveLength(27);
    expect(content.questions).toHaveLength(797);
    expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(
      sqlite.prepare('SELECT active_release_id FROM textbook_editions WHERE id=?').get(editionId)
        ?.active_release_id,
    ).toBe(releaseId);
  });
  it('serves D1 content, keeps private answers server-side and grades against that database', async () => {
    const raw = sqlite
      .prepare('SELECT body_json FROM released_questions WHERE release_id=? AND question_id=?')
      .get(releaseId, 'u2-08')!;
    const question = JSON.parse(String(raw.body_json));
    question.title = 'D1 专用标题';
    sqlite
      .prepare('UPDATE released_questions SET body_json=? WHERE release_id=? AND question_id=?')
      .run(JSON.stringify(question), releaseId, 'u2-08');
    const response = await app.request('/api/v1/questions?unit=U02', {}, { DB: db });
    const body = await response.json();
    expect(body.data.items).toHaveLength(260);
    expect(body.data.items.find((q: { id: string }) => q.id === 'u2-08').title).toBe('D1 专用标题');
    expect(JSON.stringify(body)).not.toContain('expected');
    expect(JSON.stringify(body)).not.toContain('explanation');
    const grade = await app.request(
      '/api/v1/questions/u2-08/check',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { value: '132' } }),
      },
      { DB: db },
    );
    expect((await grade.json()).data.correct).toBe(true);
    const health = await app.request('/api/v1/health', {}, { DB: db });
    expect((await health.json()).data).toMatchObject({
      status: 'ok',
      storage: 'd1',
      releaseId,
      sourceHash: buildContentSeed().sourceHash,
    });
  });
  it('does not silently switch to bundled fixtures when a bound database is incomplete', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    sqlite
      .prepare('DELETE FROM released_questions WHERE release_id=? AND question_id=?')
      .run(releaseId, 'u2-08');
    expect((await app.request('/api/v1/health', {}, { DB: db })).status).toBe(500);
    expect((await app.request('/api/v1/home', {}, { DB: db })).status).toBe(500);
  });
  it('keeps previous published releases when publishing the current release again', () => {
    sqlite
      .prepare(
        "INSERT INTO content_releases(id,edition_id,manifest_json,status) VALUES (?,?,?,'superseded')",
      )
      .run('older-release', editionId, '{}');
    sqlite.exec(buildContentSeed().sql);
    expect(
      sqlite.prepare('SELECT status FROM content_releases WHERE id=?').get('older-release')?.status,
    ).toBe('superseded');
  });
});
