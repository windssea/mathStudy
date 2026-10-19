import { z } from 'zod';

const base = {
  id: z
    .string()
    .min(8)
    .max(140)
    .regex(/^[a-zA-Z0-9:_-]+$/),
  entityId: z.string().min(1).max(80),
  occurredAt: z.iso.datetime(),
};
export const learningEventSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('visit') }).strict(),
  z.object({ ...base, kind: z.literal('complete') }).strict(),
  z.object({ ...base, kind: z.literal('assist') }).strict(),
  z
    .object({
      ...base,
      kind: z.literal('attempt'),
      answers: z
        .record(z.string().max(40), z.string().max(80))
        .refine((v) => Object.keys(v).length <= 8),
      assisted: z.boolean(),
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal('legacy'),
      correct: z.boolean(),
      revealed: z.boolean(),
      independentCorrect: z.boolean(),
    })
    .strict(),
]);
export type LearningEvent = z.infer<typeof learningEventSchema>;
export type AcceptedLearningEvent = LearningEvent & { correct?: boolean; verified?: boolean };
export type AnswerRecord = {
  correct: boolean;
  revealed: boolean;
  independentCorrect: boolean;
  date: string;
  firstAt: string;
  attemptCount: number;
  wrongCount: number;
  needsReview: boolean;
  everWrong: boolean;
  source: 'verified' | 'imported' | 'local';
};
export type AttemptRecord = {
  id: string;
  questionId: string;
  answers: Record<string, string>;
  correct: boolean;
  assisted: boolean;
  date: string;
  source: AnswerRecord['source'];
};
export type LearningSnapshot = {
  version: 1;
  lastLessonId?: string;
  lastVisitedAt?: string;
  completed: string[];
  answers: Record<string, AnswerRecord>;
  history: AttemptRecord[];
  updatedAt?: string;
};
export type PublicUser = { id: string; name: string; email: string };
export type SyncResult = { snapshot: LearningSnapshot; acknowledged: string[]; serverTime: string };
export const syncRequestSchema = z
  .object({ editionId: z.string().max(80), events: z.array(learningEventSchema).max(100) })
  .strict();

export function emptyLearning(): LearningSnapshot {
  return { version: 1, completed: [], answers: {}, history: [] };
}
/** Same reducer on both sides; only the server supplies verified grading results. */
export function applyLearningEvent(
  input: LearningSnapshot,
  event: AcceptedLearningEvent,
): LearningSnapshot {
  if (
    (event.kind === 'attempt' || event.kind === 'legacy') &&
    input.history.some((a) => a.id === event.id)
  )
    return input;
  const state = {
    ...input,
    completed: [...input.completed],
    answers: { ...input.answers },
    history: [...input.history],
  };
  state.updatedAt =
    !state.updatedAt || event.occurredAt > state.updatedAt ? event.occurredAt : state.updatedAt;
  if (event.kind === 'visit') {
    if (!state.lastVisitedAt || event.occurredAt >= state.lastVisitedAt) {
      state.lastLessonId = event.entityId;
      state.lastVisitedAt = event.occurredAt;
    }
  } else if (event.kind === 'complete') {
    if (!state.completed.includes(event.entityId)) state.completed.push(event.entityId);
  } else {
    const prior = state.answers[event.entityId];
    const isAttempt = event.kind === 'attempt' || event.kind === 'legacy';
    const correct = isAttempt ? !!event.correct : (prior?.correct ?? false);
    const assisted =
      event.kind === 'attempt' ? event.assisted : event.kind === 'legacy' ? event.revealed : true;
    const source = event.kind === 'legacy' ? 'imported' : event.verified ? 'verified' : 'local';
    const latest = !prior || event.occurredAt >= prior.date;
    const first = !prior || event.occurredAt < prior.firstAt;
    state.answers[event.entityId] = {
      correct: latest ? correct : prior.correct,
      revealed: !!prior?.revealed || assisted,
      independentCorrect: first
        ? event.kind === 'legacy'
          ? event.independentCorrect
          : isAttempt && correct && !assisted
        : prior.independentCorrect,
      firstAt: first ? event.occurredAt : prior.firstAt,
      date: latest ? event.occurredAt : prior.date,
      attemptCount: (prior?.attemptCount ?? 0) + (isAttempt ? 1 : 0),
      wrongCount: (prior?.wrongCount ?? 0) + (isAttempt && !correct ? 1 : 0),
      needsReview: latest ? !(isAttempt && correct && !assisted) : prior.needsReview,
      everWrong: !!prior?.everWrong || (isAttempt && !correct) || assisted,
      source: latest ? source : prior.source,
    };
    if (isAttempt && !state.history.some((a) => a.id === event.id))
      state.history.push({
        id: event.id,
        questionId: event.entityId,
        answers: event.kind === 'attempt' ? event.answers : {},
        correct,
        assisted,
        date: event.occurredAt,
        source,
      });
  }
  state.history.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  state.history = state.history.slice(0, 100);
  return state;
}
export function foldLearningEvents(events: AcceptedLearningEvent[]): LearningSnapshot {
  const unique = [...new Map(events.map((e) => [e.id, e])).values()];
  unique.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
  return unique.reduce(applyLearningEvent, emptyLearning());
}
