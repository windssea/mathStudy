import { textbook, lessons, questions, siteSettings } from '@mathstudy/content';
import {
  editionId,
  releaseId,
  type Lesson,
  type Question,
  type Textbook,
} from '@mathstudy/contracts';

export interface D1Statement {
  bind(...values: (string | number | null)[]): D1Statement;
}
export interface ContentDatabase {
  prepare(sql: string): D1Statement;
  batch<T>(statements: D1Statement[]): Promise<{ results: T[] }[]>;
}
export interface CourseContent {
  textbook: Textbook;
  lessons: Lesson[];
  questions: Question[];
  siteSettings: { defaultEditionId: string };
  source: 'd1' | 'fixture';
  sourceHash?: string;
}

export async function loadCourseContent(db?: ContentDatabase): Promise<CourseContent> {
  // Only direct, unbound unit tests use fixtures. A configured database must be healthy.
  if (!db) return { textbook, lessons, questions, siteSettings, source: 'fixture' };
  const rows = await db.batch<{ body_json: string }>([
    db
      .prepare(
        `SELECT manifest_json AS body_json FROM content_releases
      WHERE id = ? AND edition_id = ? AND status IN ('active', 'superseded')`,
      )
      .bind(releaseId, editionId),
    db
      .prepare('SELECT body_json FROM released_lessons WHERE release_id = ? ORDER BY lesson_id')
      .bind(releaseId),
    db
      .prepare('SELECT body_json FROM released_questions WHERE release_id = ? ORDER BY question_id')
      .bind(releaseId),
  ]);
  if (!rows[0]?.results[0]) throw new Error('D1 content release is not initialized');
  const manifest = JSON.parse(rows[0].results[0].body_json) as {
    textbook: Textbook;
    siteSettings: { defaultEditionId: string };
    lessonCount: number;
    questionCount: number;
    sourceHash: string;
  };
  if (
    manifest.textbook?.id !== editionId ||
    manifest.textbook.releaseId !== releaseId ||
    manifest.lessonCount !== rows[1].results.length ||
    manifest.questionCount !== rows[2].results.length
  )
    throw new Error('D1 content release is incomplete or mismatched');
  return {
    textbook: manifest.textbook,
    siteSettings: manifest.siteSettings,
    lessons: rows[1].results.map((row) => JSON.parse(row.body_json) as Lesson),
    questions: rows[2].results.map((row) => JSON.parse(row.body_json) as Question),
    source: 'd1',
    sourceHash: manifest.sourceHash,
  };
}
