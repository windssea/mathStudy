import { useSyncExternalStore } from 'react';
import { editionId, releaseId } from '@mathstudy/contracts';

type LocalProgress = {
  version: 1;
  lastLessonId?: string;
  completed: string[];
  answers: Record<
    string,
    { correct: boolean; revealed: boolean; independentCorrect: boolean; date: string }
  >;
};
const empty: LocalProgress = { version: 1, completed: [], answers: {} };
const key = `mathstudy:${editionId}:${releaseId}`;
const legacyKey = `mathstudy:${editionId}:preview-2026-10-u01-r1`;
const validLesson = (id: string) => /^(U01-L0[1-5]|U02-L0[1-7]|A01-L01)$/.test(id);
let cache = empty;
let storageAvailable = true;
function parseProgress(raw: string | null) {
  const value = JSON.parse(raw ?? 'null');
  if (
    value?.version === 1 &&
    Array.isArray(value.completed) &&
    value.completed.every((s: unknown) => typeof s === 'string') &&
    value.answers &&
    typeof value.answers === 'object' &&
    !Array.isArray(value.answers)
  ) {
    return {
      version: 1 as const,
      completed: [...new Set<string>(value.completed.filter((s: string) => validLesson(s)))],
      lastLessonId: validLesson(value.lastLessonId ?? '') ? value.lastLessonId : undefined,
      answers: Object.fromEntries(
        Object.entries(value.answers)
          .filter((entry) => {
            const v = entry[1] as Record<string, unknown> | null;
            return (
              /^u[1-6]-\d{2}$/.test(entry[0]) &&
              v &&
              typeof v.correct === 'boolean' &&
              typeof v.revealed === 'boolean' &&
              typeof v.date === 'string'
            );
          })
          .map(([id, raw]) => {
            const v = raw as LocalProgress['answers'][string];
            return [
              id,
              {
                ...v,
                independentCorrect:
                  typeof v.independentCorrect === 'boolean'
                    ? v.independentCorrect
                    : v.correct && !v.revealed,
              },
            ];
          }),
      ) as LocalProgress['answers'],
    };
  }
  return empty;
}
try {
  cache = parseProgress(localStorage.getItem(key) ?? localStorage.getItem(legacyKey));
} catch {
  storageAvailable = false;
}
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const getSnapshot = () => cache;
function save(update: Partial<LocalProgress>) {
  cache = { ...cache, ...update };
  try {
    localStorage.setItem(key, JSON.stringify(cache));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  [...listeners].forEach((fn) => fn());
}
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key === key) {
      try {
        cache = parseProgress(event.newValue);
        [...listeners].forEach((fn) => fn());
      } catch {
        /* Ignore a malformed value from another tab. */
      }
    }
  });
export function useProgress() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
export function visitLesson(id: string) {
  if (cache.lastLessonId !== id) save({ lastLessonId: id });
}
export function completeLesson(id: string) {
  if (!cache.completed.includes(id)) save({ completed: [...cache.completed, id] });
}
export function recordAnswer(id: string, correct: boolean, revealed: boolean) {
  const previous = cache.answers[id];
  save({
    answers: {
      ...cache.answers,
      [id]: {
        correct,
        revealed: revealed || !!previous?.revealed,
        independentCorrect: previous ? previous.independentCorrect : correct && !revealed,
        date: new Date().toISOString(),
      },
    },
  });
}
export function isStorageAvailable() {
  return storageAvailable;
}
