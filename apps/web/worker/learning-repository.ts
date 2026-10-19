import {
  foldLearningEvents,
  type AcceptedLearningEvent,
  type LearningEvent,
} from '@mathstudy/contracts';
import { sameAnswer } from '@mathstudy/math-core';
import type { ContentDatabase, CourseContent, D1Statement } from './content-repository';

interface LearningStatement extends D1Statement {
  bind(...values: (string | number | null)[]): LearningStatement;
  all<T>(): Promise<{ results: T[] }>;
}
export interface LearningDatabase extends ContentDatabase {
  prepare(sql: string): LearningStatement;
}
export function acceptLearningEvent(
  event: LearningEvent,
  content: CourseContent,
): AcceptedLearningEvent {
  if (event.kind === 'visit' || event.kind === 'complete') {
    if (!content.lessons.some((l) => l.id === event.entityId)) throw new Error('UNKNOWN_LESSON');
  } else {
    const q = content.questions.find((q) => q.id === event.entityId);
    if (!q) throw new Error('UNKNOWN_QUESTION');
    if (event.kind === 'attempt') {
      if (
        Object.keys(event.answers).length !== q.fields.length ||
        q.fields.some((f) => !event.answers[f.key]?.trim())
      )
        throw new Error('INVALID_ANSWER');
      const correct = Object.keys(q.expected).every((key) =>
        sameAnswer(event.answers[key], q.expected[key]),
      );
      return { ...event, correct, verified: true };
    }
  }
  return { ...event, verified: event.kind !== 'legacy' };
}
export async function saveLearningEvents(
  db: ContentDatabase,
  userId: string,
  content: CourseContent,
  events: LearningEvent[],
) {
  const accepted = events.map((event) => {
    const time = Date.parse(event.occurredAt);
    if (!Number.isFinite(time) || time < Date.UTC(2000, 0, 1)) throw new Error('INVALID_DATE');
    return acceptLearningEvent(
      { ...event, occurredAt: new Date(Math.min(time, Date.now() + 300000)).toISOString() },
      content,
    );
  });
  if (accepted.length)
    await db.batch(
      accepted.map((event) =>
        db
          .prepare(
            `INSERT INTO learning_events(user_id,id,edition_id,entity_id,kind,occurred_at,payload_json)
    VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,id) DO NOTHING`,
          )
          .bind(
            userId,
            event.id,
            content.textbook.id,
            event.entityId,
            event.kind,
            event.occurredAt,
            JSON.stringify(event),
          ),
      ),
    );
  return accepted.map((e) => e.id);
}
export async function readLearning(db: ContentDatabase, userId: string, edition: string) {
  const rows = await (db as LearningDatabase)
    .prepare(
      'SELECT payload_json FROM learning_events WHERE user_id=? AND edition_id=? ORDER BY occurred_at,id',
    )
    .bind(userId, edition)
    .all<{ payload_json: string }>();
  return foldLearningEvents(
    rows.results.map((row) => JSON.parse(row.payload_json) as AcceptedLearningEvent),
  );
}
