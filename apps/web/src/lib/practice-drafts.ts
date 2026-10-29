import { editionId, releaseId, visualSchema } from '@mathstudy/contracts';
import { z } from 'zod';

// Drafts belong to this tab and identity. They are never learning history or a sync source.
const draftNamespace = 'mathstudy:drafts:';
const prefix = `${draftNamespace}${editionId}:${releaseId}:`;
const lifetime = 24 * 60 * 60 * 1000;
const explanation = z.object({
  analysis: z.string(),
  steps: z.array(z.string()),
  answer: z.string(),
  pitfall: z.string(),
  visual: visualSchema.optional(),
});
export const questionDraftSchema = z.object({
  answers: z.record(z.string(), z.string().max(2000)),
  hint: z.boolean(),
  usedHelp: z.boolean(),
  revealed: z.boolean(),
  view: z.enum(['answer', 'method', 'explanation']),
  grade: z.object({ correct: z.boolean(), feedback: z.string() }).optional(),
  explanation: explanation.optional(),
});
export const practiceResultSchema = z.object({
  status: z.enum(['correct', 'incorrect', 'revealed', 'skipped']),
  assisted: z.boolean(),
});
export const practiceDraftSchema = z.object({
  poolIds: z.array(z.string()).default([]),
  ids: z.array(z.string()),
  index: z.number().int().nonnegative(),
  round: z.number().int().nonnegative(),
  mode: z.enum(['short', 'all', 'review']),
  completed: z.array(z.string()),
  results: z.record(z.string(), practiceResultSchema),
});
export type PracticeDraft = z.infer<typeof practiceDraftSchema>;

function key(owner: string, id: string) {
  return `${prefix}${encodeURIComponent(owner)}:${id}`;
}
export function readDraft<T>(owner: string, id: string, schema: z.ZodType<T>): T | undefined {
  try {
    const entry = JSON.parse(sessionStorage.getItem(key(owner, id)) ?? 'null');
    if (!entry || typeof entry.savedAt !== 'number' || Date.now() - entry.savedAt > lifetime)
      return;
    const parsed = schema.safeParse(entry.data);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return;
  }
}
export function writeDraft(owner: string, id: string, data: unknown) {
  try {
    sessionStorage.setItem(key(owner, id), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // A disabled/full cache must never prevent an answer or a learning event.
  }
}
export function clearPracticeDrafts() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const entry = sessionStorage.key(i);
      if (entry?.startsWith(draftNamespace)) sessionStorage.removeItem(entry);
    }
  } catch {
    // Learning records and the sync outbox are deliberately outside this namespace.
  }
}
