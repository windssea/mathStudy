import { useSyncExternalStore } from 'react';
import {
  editionId,
  releaseId,
  emptyLearning,
  applyLearningEvent,
  learningEventSchema,
  type AcceptedLearningEvent,
  type LearningEvent,
  type LearningSnapshot,
  type PublicUser,
  type SyncResult,
} from '@mathstudy/contracts';
import { ApiError, request } from './api';

type Scope = {
  id: string;
  base: LearningSnapshot;
  pending: Map<string, AcceptedLearningEvent>;
  imported: string[];
  serverTime?: string;
};
type AccountState = {
  user: PublicUser | null;
  ready: boolean;
  syncing: boolean;
  pending: number;
  error: string;
  lastSynced?: string;
  available: boolean;
};
const key = `mathstudy:${editionId}:${releaseId}`,
  legacyKey = `mathstudy:${editionId}:preview-2026-10-u01-r1`;
const prefix = `mathstudy:v2:${editionId}:`,
  sessionSignal = 'mathstudy:account-change';
const validLesson = (id: string) =>
  /^(U01-L0[1-5]|U02-L0[1-7]|U03-L0[1-4]|U04-L0[1-3]|A01-L01)$/.test(id);
const listeners = new Set<() => void>(),
  scopes = new Map<string, Scope>();
let storageAvailable = true,
  lastEventTime = 0;
let account: AccountState = {
  user: null,
  ready: false,
  syncing: false,
  pending: 0,
  error: '',
  available: true,
};
function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    storageAvailable = false;
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    storageAvailable = false;
  }
}
function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    storageAvailable = false;
  }
}
let installation = read('mathstudy:installation');
if (!installation) {
  installation = crypto.randomUUID();
  write('mathstudy:installation', installation);
}
function outboxPrefix(id: string) {
  return `${prefix}${id}:event:`;
}
function wire(event: AcceptedLearningEvent): LearningEvent {
  const { id, kind, entityId, occurredAt } = event;
  if (kind === 'attempt')
    return { id, kind, entityId, occurredAt, answers: event.answers, assisted: event.assisted };
  if (kind === 'legacy')
    return {
      id,
      kind,
      entityId,
      occurredAt,
      correct: event.correct,
      revealed: event.revealed,
      independentCorrect: event.independentCorrect,
    };
  return { id, kind, entityId, occurredAt };
}
function load(id: string) {
  let scope = scopes.get(id);
  if (!scope) {
    scope = { id, base: emptyLearning(), pending: new Map(), imported: [] };
    try {
      const value = JSON.parse(read(`${prefix}${id}:base`) ?? 'null');
      if (
        value?.base?.version === 1 &&
        Array.isArray(value.base.history) &&
        Array.isArray(value.base.completed) &&
        value.base.answers
      ) {
        scope.base = value.base;
        scope.serverTime = value.serverTime;
        scope.imported = Array.isArray(value.imported) ? value.imported : [];
      }
    } catch {
      /* Keep the independent outbox even if a cache is corrupt. */
    }
    scopes.set(id, scope);
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(outboxPrefix(id))) continue;
      try {
        const event = JSON.parse(localStorage.getItem(k)!);
        learningEventSchema.parse(wire(event));
        scope.pending.set(event.id, event);
      } catch {
        /* Ignore an invalid cache entry. */
      }
    }
  } catch {
    storageAvailable = false;
  }
  return scope;
}
function add(scope: Scope, event: AcceptedLearningEvent) {
  scope.pending.set(event.id, event);
  write(outboxPrefix(scope.id) + event.id, JSON.stringify(event));
}
export function nextLearningTime() {
  lastEventTime = Math.max(Date.now(), lastEventTime + 1);
  return new Date(lastEventTime).toISOString();
}
export function makeLearningEvent(
  kind: 'attempt',
  entityId: string,
  answers: Record<string, string>,
  assisted: boolean,
): Extract<LearningEvent, { kind: 'attempt' }> {
  return {
    kind,
    id: crypto.randomUUID(),
    entityId,
    occurredAt: nextLearningTime(),
    answers: { ...answers },
    assisted,
  };
}
function migrateLegacy() {
  const guest = load('guest');
  if (read(`${prefix}guest:legacy-migrated`)) return;
  try {
    const raw = JSON.parse(
      read(key) ??
        read(`mathstudy:${editionId}:preview-2026-10-u03-r1`) ??
        read(`mathstudy:${editionId}:preview-2026-10-u02-r1`) ??
        read(legacyKey) ??
        'null',
    );
    if (
      raw?.version === 1 &&
      Array.isArray(raw.completed) &&
      raw.answers &&
      typeof raw.answers === 'object'
    ) {
      const stamp = nextLearningTime();
      for (const id of new Set<string>(raw.completed))
        if (typeof id === 'string' && validLesson(id))
          add(guest, {
            id: `legacy:${installation}:complete:${id}`,
            kind: 'complete',
            entityId: id,
            occurredAt: stamp,
          });
      for (const [id, value] of Object.entries(raw.answers)) {
        const a = value as {
          correct?: boolean;
          revealed?: boolean;
          independentCorrect?: boolean;
          date?: string;
        };
        if (
          !/^u[1-6]-\d{2}$/.test(id) ||
          typeof a?.correct !== 'boolean' ||
          typeof a?.revealed !== 'boolean'
        )
          continue;
        const date = Date.parse(a.date ?? '');
        add(guest, {
          id: `legacy:${installation}:${id}`,
          kind: 'legacy',
          entityId: id,
          occurredAt: Number.isFinite(date) ? new Date(date).toISOString() : stamp,
          correct: a.correct,
          revealed: a.revealed,
          independentCorrect: a.independentCorrect ?? (a.correct && !a.revealed),
        });
      }
      if (validLesson(raw.lastLessonId ?? ''))
        add(guest, {
          id: `legacy:${installation}:visit`,
          kind: 'visit',
          entityId: raw.lastLessonId,
          occurredAt: stamp,
        });
    }
    write(`${prefix}guest:legacy-migrated`, '1');
  } catch {
    /* The original file is retained; do not replace it with an empty record. */
  }
}
migrateLegacy();
let current = load('guest');
function derive(scope: Scope) {
  return [...scope.pending.values()]
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id))
    .reduce(applyLearningEvent, scope.base);
}
let cache = derive(current);
function notify() {
  cache = derive(current);
  account = { ...account, pending: account.user ? current.pending.size : 0 };
  [...listeners].forEach((fn) => fn());
}
function saveBase(scope: Scope) {
  write(
    `${prefix}${scope.id}:base`,
    JSON.stringify({ base: scope.base, serverTime: scope.serverTime, imported: scope.imported }),
  );
}
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function useProgress() {
  return useSyncExternalStore(subscribe, () => cache);
}
export function useAccount() {
  return useSyncExternalStore(subscribe, () => account);
}
export function currentAccountHeaders(): Record<string, string> {
  return account.user ? { 'X-MathStudy-Account': account.user.id } : {};
}
let retryTimer: ReturnType<typeof setTimeout> | undefined,
  delay = 1000;
const running = new Map<string, Promise<void>>();
let active = false,
  sessionRequest = 0;
function schedule(ms = 250) {
  if (!active || !account.user) return;
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    void synchronize().catch(() => {});
  }, ms);
}
export function currentLearningOwner() {
  return current.id;
}
function record(event: AcceptedLearningEvent, owner = current.id) {
  const target = load(owner);
  add(target, event);
  if (owner !== current.id) return;
  notify();
  if (!account.user) write(key, JSON.stringify(cache));
  schedule();
}
export function visitLesson(id: string) {
  if (cache.lastLessonId !== id)
    record({
      kind: 'visit',
      id: crypto.randomUUID(),
      entityId: id,
      occurredAt: nextLearningTime(),
    });
}
export function completeLesson(id: string) {
  if (!cache.completed.includes(id))
    record({
      kind: 'complete',
      id: crypto.randomUUID(),
      entityId: id,
      occurredAt: nextLearningTime(),
    });
}
export function recordAnswer(
  id: string,
  correct: boolean,
  revealed: boolean,
  event?: Extract<LearningEvent, { kind: 'attempt' }>,
  owner = current.id,
) {
  if (event) record({ ...event, correct, verified: false }, owner);
  else
    record(
      {
        kind: 'legacy',
        id: crypto.randomUUID(),
        entityId: id,
        occurredAt: nextLearningTime(),
        correct,
        revealed,
        independentCorrect: correct && !revealed,
      },
      owner,
    );
}
export function recordAssistance(id: string, owner = current.id) {
  record(
    { kind: 'assist', id: crypto.randomUUID(), entityId: id, occurredAt: nextLearningTime() },
    owner,
  );
}
export function isStorageAvailable() {
  return storageAvailable;
}
export function progressMessage() {
  return account.user
    ? account.error
      ? '云端暂未同步，记录已保留，连接恢复后会重试。'
      : account.pending || account.syncing
        ? '正在同步到账号…'
        : '记录已同步到账号，可在其他设备登录查看。'
    : storageAvailable
      ? '记录保存在当前设备，登录后可合并到账号。'
      : '当前浏览器无法持久保存记录，请登录同步。';
}
export async function synchronize(): Promise<void> {
  const user = account.user;
  if (!user) return;
  const existing = running.get(user.id);
  if (existing) return existing;
  const scope = load(user.id);
  const work = (async () => {
    if (account.user?.id === user.id) {
      account = { ...account, syncing: true, error: '' };
      notify();
    }
    try {
      let again = true;
      while (again) {
        load(user.id);
        const events = [...scope.pending.values()]
          .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id))
          .slice(0, 100)
          .map(wire);
        const result = await request<SyncResult>('/me/sync', {
          method: 'POST',
          headers: { 'X-MathStudy-Account': user.id },
          body: JSON.stringify({ editionId, events }),
        });
        for (const id of result.acknowledged) {
          scope.pending.delete(id);
          remove(outboxPrefix(user.id) + id);
        }
        scope.base = result.snapshot;
        scope.serverTime = result.serverTime;
        saveBase(scope);
        again = scope.pending.size > 0 && account.user?.id === user.id;
        if (account.user?.id === user.id) {
          account = { ...account, lastSynced: result.serverTime, error: '' };
          notify();
        }
      }
      delay = 1000;
    } catch (error) {
      if (account.user?.id === user.id) {
        account = { ...account, error: error instanceof Error ? error.message : '暂时无法同步。' };
        notify();
        if (error instanceof ApiError && (error.status === 401 || error.status === 409)) {
          void refreshAccount();
        } else {
          delay = Math.min(delay * 2, 30000);
          schedule(delay);
        }
      }
      throw error;
    } finally {
      running.delete(user.id);
      if (account.user?.id === user.id) {
        account = { ...account, syncing: false };
        notify();
      }
    }
  })();
  running.set(user.id, work);
  return work;
}
export async function refreshAccount() {
  const revision = ++sessionRequest;
  try {
    const result = await request<{ user: PublicUser | null; available: boolean }>('/account');
    if (revision !== sessionRequest) return;
    const changed = account.user?.id !== result.user?.id;
    account = {
      ...account,
      user: result.user,
      ready: true,
      available: result.available,
      error: '',
      syncing: changed ? false : account.syncing,
      lastSynced: changed ? undefined : account.lastSynced,
    };
    current = load(result.user?.id ?? 'guest');
    notify();
    if (result.user) await synchronize();
  } catch (error) {
    if (revision === sessionRequest) {
      account = {
        ...account,
        ready: true,
        error: error instanceof Error ? error.message : '无法连接账号。',
      };
      notify();
    }
  }
}
export async function authenticate(username: string, password: string) {
  const response = await fetch('/api/auth/sign-in/username', {
    method: 'POST',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username.trim().toLowerCase(),
      password,
    }),
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { code?: string };
    const errors: Record<string, string> = {
      INVALID_EMAIL_OR_PASSWORD: '账号或密码不正确。',
      INVALID_LOGIN: '请输入有效的账号和密码。',
      REGISTRATION_CLOSED: '仅支持内置账号登录，不开放注册。',
    };
    throw new Error(
      response.status === 429
        ? '尝试次数较多，请稍后再试。'
        : (errors[result.code ?? ''] ?? '暂时无法登录，请检查信息后重试。'),
    );
  }
  await refreshAccount();
  write(sessionSignal, crypto.randomUUID());
  if (!account.user) throw new Error('尚未完成登录，请重试。');
}
export async function signOut() {
  await synchronize().catch(() => {});
  const response = await fetch('/api/auth/sign-out', {
    method: 'POST',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!response.ok) throw new Error('退出未成功，请连接网络后重试。');
  ++sessionRequest;
  account = { user: null, ready: true, syncing: false, pending: 0, error: '', available: true };
  current = load('guest');
  notify();
  write(sessionSignal, crypto.randomUUID());
}
export function guestImportInfo() {
  const guest = load('guest'),
    ids = [...guest.pending.keys()].filter((id) => !current.imported.includes(id));
  return {
    events: ids.length,
    lessons: derive(guest).completed.length,
    questions: Object.keys(derive(guest).answers).length,
  };
}
export async function importGuest() {
  if (!account.user) throw new Error('请先登录。');
  const scope = current;
  for (const event of load('guest').pending.values())
    if (!scope.imported.includes(event.id)) {
      add(scope, event);
      scope.imported.push(event.id);
    }
  saveBase(scope);
  notify();
  await synchronize();
}
export function startLearningSync() {
  active = true;
  void refreshAccount();
  const refresh = () => {
    if (!document.hidden) void refreshAccount();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === sessionSignal) {
      void refreshAccount();
      return;
    }
    if (event.key?.startsWith(outboxPrefix(current.id))) {
      load(current.id);
      notify();
      schedule();
    }
  };
  const interval = setInterval(refresh, 30000);
  window.addEventListener('focus', refresh);
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('storage', onStorage);
  return () => {
    active = false;
    clearInterval(interval);
    clearTimeout(retryTimer);
    window.removeEventListener('focus', refresh);
    window.removeEventListener('online', refresh);
    document.removeEventListener('visibilitychange', refresh);
    window.removeEventListener('storage', onStorage);
  };
}
