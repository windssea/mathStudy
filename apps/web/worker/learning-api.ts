import { Hono } from 'hono';
import { syncRequestSchema } from '@mathstudy/contracts';
import { sessionUser } from './auth';
import { readLearning, saveLearningEvents } from './learning-repository';
import type { WorkerEnvironment } from './environment';

export const learningApi = new Hono<WorkerEnvironment>();
learningApi.use('*', async (c, next) => {
  const user = await sessionUser(c.env, c.req.raw);
  if (!user)
    return c.json(
      {
        error: { code: 'UNAUTHENTICATED', message: '请先登录，再同步学习记录。' },
        requestId: c.get('requestId'),
      },
      401,
    );
  if (c.req.header('X-MathStudy-Account') !== user.id)
    return c.json(
      {
        error: { code: 'ACCOUNT_CHANGED', message: '登录账号已变化，请重新加载账号记录。' },
        requestId: c.get('requestId'),
      },
      409,
    );
  c.set('user', user);
  await next();
});
learningApi.get('/progress', async (c) => {
  const content = c.get('content');
  return c.json({
    data: {
      snapshot: await readLearning(c.env.DB!, c.get('user').id, content.textbook.id),
      acknowledged: [],
      serverTime: new Date().toISOString(),
    },
    requestId: c.get('requestId'),
  });
});
learningApi.post('/sync', async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json(
      {
        error: { code: 'INVALID_JSON', message: '同步数据格式不正确。' },
        requestId: c.get('requestId'),
      },
      400,
    );
  }
  const parsed = syncRequestSchema.safeParse(raw),
    content = c.get('content');
  if (!parsed.success || parsed.data.editionId !== content.textbook.id)
    return c.json(
      {
        error: { code: 'INVALID_SYNC', message: '请检查教材和同步数据。' },
        requestId: c.get('requestId'),
      },
      400,
    );
  let acknowledged: string[];
  try {
    acknowledged = await saveLearningEvents(
      c.env.DB!,
      c.get('user').id,
      content,
      parsed.data.events,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      ['UNKNOWN_LESSON', 'UNKNOWN_QUESTION', 'INVALID_ANSWER', 'INVALID_DATE'].includes(
        error.message,
      )
    )
      return c.json(
        {
          error: { code: 'INVALID_EVENT', message: '同步记录中的课程或答案格式不正确。' },
          requestId: c.get('requestId'),
        },
        400,
      );
    throw error;
  }
  return c.json({
    data: {
      snapshot: await readLearning(c.env.DB!, c.get('user').id, content.textbook.id),
      acknowledged,
      serverTime: new Date().toISOString(),
    },
    requestId: c.get('requestId'),
  });
});
