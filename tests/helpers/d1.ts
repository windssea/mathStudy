import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import type { ContentDatabase, D1Statement } from '../../apps/web/worker/content-repository';
import { buildContentSeed } from '../../scripts/lib/d1-seed';

export function testDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync('packages/database/migrations')
    .filter((f) => f.endsWith('.sql'))
    .sort())
    sqlite.exec(readFileSync(`packages/database/migrations/${file}`, 'utf8'));
  sqlite.exec(buildContentSeed().sql);
  class Statement implements D1Statement {
    constructor(
      readonly sql: string,
      readonly values: (string | number | null)[] = [],
    ) {}
    bind(...values: (string | number | null)[]) {
      return new Statement(this.sql, values);
    }
    execute<T>() {
      const s = sqlite.prepare(this.sql);
      let results: T[] = [];
      if (s.columns().length) results = s.all(...this.values) as T[];
      else s.run(...this.values);
      const meta = sqlite
        .prepare('SELECT changes() AS changes,last_insert_rowid() AS last_row_id')
        .get() as { changes: number; last_row_id: number };
      return { results, success: true, meta };
    }
    async all<T>() {
      return this.execute<T>();
    }
    async run() {
      return this.execute();
    }
    async first<T>() {
      return this.execute<T>().results[0] ?? null;
    }
  }
  const db: ContentDatabase & {
    exec: (sql: string) => Promise<{ count: number; duration: number }>;
  } = {
    prepare: (sql) => new Statement(sql),
    async batch<T>(statements: D1Statement[]) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map((s) => (s as Statement).execute<T>());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    async exec(sql) {
      sqlite.exec(sql);
      return { count: 1, duration: 0 };
    },
  };
  return { db, sqlite, close: () => sqlite.close() };
}
