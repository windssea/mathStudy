import { Hono } from 'hono';
import {
  submissionSchema,
  editionId,
  difficultySchema,
  questionTypeSchema,
} from '@mathstudy/contracts';
import { publicQuestion } from '@mathstudy/content';
import { loadCourseContent } from './content-repository';
import { sameAnswer } from '@mathstudy/math-core';
import { bodyLimit } from 'hono/body-limit';
import { getAuth, sessionUser } from './auth';
import { learningApi } from './learning-api';
import { saveLearningEvents } from './learning-repository';
import type { WorkerEnvironment } from './environment';

const app = new Hono<WorkerEnvironment>();
app.use('/api/*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  if (c.req.method !== 'GET') {
    const origin = c.req.header('Origin');
    if (origin && origin !== new URL(c.req.url).origin)
      return c.json(
        {
          error: { code: 'ORIGIN_REJECTED', message: '请求来源不匹配。' },
          requestId: c.get('requestId'),
        },
        403,
      );
  }
  await next();
});
app.use(
  '/api/*',
  bodyLimit({
    maxSize: 160 * 1024,
    onError: (c) =>
      c.json(
        {
          error: { code: 'TOO_LARGE', message: '一次同步的数据过多，请分批重试。' },
          requestId: c.get('requestId'),
        },
        413,
      ),
  }),
);
app.onError((error, c) => {
  console.error('request_failed', c.get('requestId'), error.message);
  return c.json(
    {
      error: { code: 'INTERNAL_ERROR', message: '暂时无法完成，请重试。' },
      requestId: c.get('requestId'),
    },
    500,
  );
});
app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
  if (
    ![
      '/api/auth/sign-in/email',
      '/api/auth/sign-up/email',
      '/api/auth/sign-out',
      '/api/auth/change-password',
    ].includes(c.req.path)
  )
    return c.json({ error: { code: 'NOT_FOUND', message: '接口不存在。' } }, 404);
  if (!c.env?.DB || !c.env.AUTH_SECRET)
    return c.json(
      { error: { code: 'AUTH_UNAVAILABLE', message: '登录服务尚未配置，请稍后重试。' } },
      503,
    );
  if (c.req.method === 'POST' && c.req.path === '/api/auth/sign-up/email') {
    const input = (await c.req.raw
      .clone()
      .json()
      .catch(() => null)) as { name?: unknown; email?: unknown } | null;
    if (
      !input ||
      typeof input.name !== 'string' ||
      !input.name.trim() ||
      input.name.length > 40 ||
      typeof input.email !== 'string' ||
      input.email.length > 254
    )
      return c.json({ code: 'INVALID_REGISTRATION', message: '请检查昵称和邮箱。' }, 400);
  }
  return getAuth(c.env, c.req.url).handler(c.req.raw);
});
app.get('/api/v1/account', async (c) =>
  c.json({
    data: { user: await sessionUser(c.env ?? {}, c.req.raw), available: !!c.env?.AUTH_SECRET },
    requestId: c.get('requestId'),
  }),
);
app.use('/api/v1/*', async (c, next) => {
  c.set('content', await loadCourseContent(c.env?.DB));
  await next();
});
app.route('/api/v1/me', learningApi);
const envelope = <T>(data: T, requestId: string) => ({ data, requestId });
app.get('/api/v1/health', (c) => {
  const content = c.get('content');
  return c.json(
    envelope(
      {
        status: 'ok',
        releaseId: content.textbook.releaseId,
        storage: content.source,
        sourceHash: content.sourceHash,
        deployment: c.env?.CF_VERSION_METADATA,
        accountSync: !!c.env?.AUTH_SECRET,
      },
      c.get('requestId'),
    ),
  );
});
app.get('/api/v1/home', (c) => {
  const { textbook, lessons, questions, siteSettings } = c.get('content');
  return c.json(
    envelope(
      {
        textbook,
        settings: siteSettings,
        availableLessons: lessons.length,
        questionCount: questions.length,
      },
      c.get('requestId'),
    ),
  );
});
app.get('/api/v1/textbooks', (c) =>
  c.json(envelope([c.get('content').textbook], c.get('requestId'))),
);
app.get('/api/v1/textbooks/:edition/catalog', (c) => {
  const { textbook } = c.get('content');
  if (c.req.param('edition') !== editionId)
    return c.json(
      { error: { code: 'NOT_FOUND', message: '未找到这本教材。' }, requestId: c.get('requestId') },
      404,
    );
  return c.json(envelope(textbook, c.get('requestId')));
});
app.get('/api/v1/textbooks/:edition/lessons/:lesson', (c) => {
  const { lessons, questions } = c.get('content');
  const lesson =
    c.req.param('edition') === editionId
      ? lessons.find((l) => l.id === c.req.param('lesson'))
      : undefined;
  if (!lesson)
    return c.json(
      { error: { code: 'NOT_FOUND', message: '这一课尚未开放。' }, requestId: c.get('requestId') },
      404,
    );
  return c.json(
    envelope(
      {
        lesson,
        questions: lesson.questionIds.map((id) =>
          publicQuestion(questions.find((q) => q.id === id)!),
        ),
      },
      c.get('requestId'),
    ),
  );
});
app.get('/api/v1/questions', (c) => {
  const { textbook, questions } = c.get('content');
  const { unit, difficulty, type, search = '' } = c.req.query();
  if (
    (unit && !textbook.catalog.some((n) => n.kind === 'unit' && n.id === unit)) ||
    (difficulty && !difficultySchema.safeParse(difficulty).success) ||
    (type && !questionTypeSchema.safeParse(type).success) ||
    search.length > 100
  ) {
    return c.json(
      {
        error: { code: 'INVALID_FILTER', message: '请检查题库筛选条件。' },
        requestId: c.get('requestId'),
      },
      400,
    );
  }
  const matches = questions.filter(
    (q) =>
      (!unit || q.unitId === unit) &&
      (!difficulty || q.difficulty === difficulty) &&
      (!type || q.type === type) &&
      (!search || `${q.stem}${q.title}`.includes(search)),
  );
  return c.json(
    envelope({ items: matches.map(publicQuestion), total: matches.length }, c.get('requestId')),
  );
});
app.post('/api/v1/questions/:id/check', async (c) => {
  const { questions } = c.get('content');
  const question = questions.find((q) => q.id === c.req.param('id'));
  if (!question)
    return c.json(
      { error: { code: 'NOT_FOUND', message: '题目不存在。' }, requestId: c.get('requestId') },
      404,
    );
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json(
      {
        error: { code: 'INVALID_JSON', message: '答案格式不正确。' },
        requestId: c.get('requestId'),
      },
      400,
    );
  }
  const parsed = submissionSchema.safeParse(raw);
  if (
    !parsed.success ||
    Object.keys(parsed.data.answers).length !== question.fields.length ||
    question.fields.some((f) => !parsed.data.answers[f.key]?.trim())
  )
    return c.json(
      {
        error: { code: 'INVALID_ANSWER', message: '请填写所有答案。' },
        requestId: c.get('requestId'),
      },
      400,
    );
  const correct = Object.keys(question.expected).every((key) =>
    sameAnswer(parsed.data.answers[key], question.expected[key]),
  );
  const user = await sessionUser(c.env ?? {}, c.req.raw);
  if (user) {
    if (c.req.header('X-MathStudy-Account') !== user.id)
      return c.json(
        { error: { code: 'ACCOUNT_CHANGED', message: '登录账号已变化，请刷新后重试。' } },
        409,
      );
    await saveLearningEvents(c.env.DB!, user.id, c.get('content'), [
      {
        kind: 'attempt',
        id: parsed.data.attemptId ?? crypto.randomUUID(),
        entityId: question.id,
        occurredAt: parsed.data.occurredAt ?? new Date().toISOString(),
        answers: parsed.data.answers,
        assisted: parsed.data.assisted ?? false,
      },
    ]);
  }
  return c.json(
    envelope(
      {
        correct,
        feedback: correct
          ? '答对了！再看看思路，理解为什么。'
          : '再想一想。对照分析，找出需要调整的那一步。',
        explanation: question.explanation,
      },
      c.get('requestId'),
    ),
  );
});
app.post('/api/v1/questions/:id/explanation', (c) => {
  const { questions } = c.get('content');
  const question = questions.find((q) => q.id === c.req.param('id'));
  if (!question)
    return c.json(
      { error: { code: 'NOT_FOUND', message: '题目不存在。' }, requestId: c.get('requestId') },
      404,
    );
  return c.json(envelope(question.explanation, c.get('requestId')));
});
app.all('/api/*', (c) =>
  c.json(
    { error: { code: 'NOT_FOUND', message: '接口不存在。' }, requestId: c.get('requestId') },
    404,
  ),
);
export { app };
export default app;
