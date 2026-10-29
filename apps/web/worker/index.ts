import { Hono } from 'hono';
import {
  submissionSchema,
  editionId,
  difficultySchema,
  questionTypeSchema,
} from '@mathstudy/contracts';
import { publicQuestion } from '@mathstudy/content';
import { loadCourseContent, type CourseContent } from './content-repository';
import { gradeAnswers } from '@mathstudy/math-core';
import { bodyLimit } from 'hono/body-limit';
import { builtInEmail, getAuth, sessionUser } from './auth';
import { learningApi } from './learning-api';
import { saveLearningEvents } from './learning-repository';
import type { WorkerEnvironment } from './environment';

const app = new Hono<WorkerEnvironment>();
function teachingTopics(content: CourseContent, items: { topicIds?: string[] }[]) {
  const ids = new Set(items.flatMap((q) => q.topicIds ?? []));
  return content.practice.topics.filter((topic) => ids.has(topic.id));
}
app.all('/papers/*', (c) => c.json({ error: { code: 'NOT_FOUND', message: '资源不存在。' } }, 404));
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
  if (['/api/auth/sign-up/email', '/api/auth/sign-in/email'].includes(c.req.path))
    return c.json(
      { code: 'REGISTRATION_CLOSED', message: '仅支持内置账号登录，不开放注册。' },
      403,
    );
  if (!['/api/auth/sign-in/username', '/api/auth/sign-out'].includes(c.req.path))
    return c.json({ error: { code: 'NOT_FOUND', message: '接口不存在。' } }, 404);
  if (!c.env?.DB || !c.env.AUTH_SECRET)
    return c.json(
      { error: { code: 'AUTH_UNAVAILABLE', message: '登录服务尚未配置，请稍后重试。' } },
      503,
    );
  if (c.req.path === '/api/auth/sign-in/username') {
    if (c.req.method !== 'POST') return c.json({ code: 'METHOD_NOT_ALLOWED' }, 405);
    const input = (await c.req.raw
      .clone()
      .json()
      .catch(() => null)) as { username?: unknown; password?: unknown } | null;
    if (
      !input ||
      typeof input.username !== 'string' ||
      !/^[a-z][a-z0-9_-]{2,31}$/.test(input.username.trim().toLowerCase()) ||
      typeof input.password !== 'string' ||
      input.password.length > 128
    )
      return c.json({ code: 'INVALID_LOGIN', message: '请输入有效的账号和密码。' }, 400);
    const email = await builtInEmail(c.env.DB, input.username.trim().toLowerCase());
    const url = new URL(c.req.url);
    url.pathname = '/api/auth/sign-in/email';
    const headers = new Headers(c.req.raw.headers);
    headers.delete('content-length');
    return getAuth(c.env, c.req.url).handler(
      new Request(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password: input.password }),
      }),
    );
  }
  return getAuth(c.env, c.req.url).handler(c.req.raw);
});
app.get('/api/v1/account', async (c) =>
  c.json({
    data: {
      user: await sessionUser(c.env ?? {}, c.req.raw, (cookie) =>
        c.header('Set-Cookie', cookie, { append: true }),
      ),
      available: !!c.env?.AUTH_SECRET,
    },
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
        topics: teachingTopics(
          c.get('content'),
          questions.filter((q) => lesson.questionIds.includes(q.id)),
        ),
      },
      c.get('requestId'),
    ),
  );
});
app.use('/api/v1/practice/*', async (c, next) => {
  const { difficulty, type } = c.req.query();
  if (
    (difficulty && !difficultySchema.safeParse(difficulty).success) ||
    (type && !questionTypeSchema.safeParse(type).success)
  )
    return c.json({ error: { code: 'INVALID_FILTER', message: '请检查筛选条件。' } }, 400);
  await next();
});
app.get('/api/v1/practice', (c) => {
  const content = c.get('content');
  const { difficulty, type } = c.req.query();
  if (
    (difficulty && !difficultySchema.safeParse(difficulty).success) ||
    (type && !questionTypeSchema.safeParse(type).success)
  )
    return c.json({ error: { code: 'INVALID_FILTER', message: '请检查筛选条件。' } }, 400);
  const allowed = new Set(
    content.questions
      .filter((q) => (!difficulty || q.difficulty === difficulty) && (!type || q.type === type))
      .map((q) => q.id),
  );
  return c.json(
    envelope(
      {
        topics: content.practice.topics.map((topic) => ({
          ...topic,
          questionIds: topic.questionIds.filter((id) => allowed.has(id)),
        })),
        units: content.practice.units,
        papers: [],
      },
      c.get('requestId'),
    ),
  );
});
app.get('/api/v1/practice/:kind/:id', (c) => {
  const content = c.get('content'),
    kind = c.req.param('kind');
  let set = (kind === 'topics' ? content.practice.topics : []).find(
    (s) => s.id === c.req.param('id'),
  );
  // Existing general-topic deep links remain useful without reappearing in the catalog.
  const legacyUnits = {
    'u1-calculation': 'U01',
    'u3-general': 'U03',
    'u4-general': 'U04',
    'u5-general': 'U05',
    'u6-general': 'U06',
  };
  const legacyId = c.req.param('id');
  const legacyUnit = Object.hasOwn(legacyUnits, legacyId)
    ? legacyUnits[legacyId as keyof typeof legacyUnits]
    : undefined;
  if (!set && kind === 'topics' && legacyUnit) {
    set = {
      id: c.req.param('id'),
      unitId: legacyUnit,
      title:
        legacyId === 'u1-calculation'
          ? '口算与笔算'
          : content.textbook.catalog.find((node) => node.id === legacyUnit)!.title,
      questionIds: [
        ...new Set(
          content.practice.topics
            .filter((t) => t.unitId === legacyUnit)
            .flatMap((t) => t.questionIds),
        ),
      ],
    };
  }
  if (!set) return c.json({ error: { code: 'NOT_FOUND', message: '未找到这组练习。' } }, 404);
  const { difficulty, type } = c.req.query();
  const items = set.questionIds
    .map((id) => content.questions.find((q) => q.id === id)!)
    .filter((q) => (!difficulty || q.difficulty === difficulty) && (!type || q.type === type));
  return c.json(
    envelope(
      {
        set: { ...set, questionIds: items.map((q) => q.id) },
        items: items.map(publicQuestion),
        topics: teachingTopics(content, items),
      },
      c.get('requestId'),
    ),
  );
});
app.get('/api/v1/questions', (c) => {
  const { textbook, questions } = c.get('content');
  const {
    unit,
    difficulty,
    type,
    topic,
    search = '',
    scope = 'practice',
    ids,
    page,
    pageSize,
  } = c.req.query();
  const topics = c.get('content').practice.topics;
  const requestedIds = ids === undefined ? undefined : new Set(ids.split(',').filter(Boolean));
  const paginated = page !== undefined || pageSize !== undefined;
  const size = Number(pageSize ?? 12);
  const requestedPage = Number(page ?? 1);
  if (
    (unit && !textbook.catalog.some((n) => n.kind === 'unit' && n.id === unit)) ||
    (difficulty && !difficultySchema.safeParse(difficulty).success) ||
    (type && !questionTypeSchema.safeParse(type).success) ||
    (topic && !topics.some((item) => item.id === topic)) ||
    (requestedIds && requestedIds.size > 100) ||
    (paginated &&
      (!Number.isSafeInteger(size) ||
        size < 1 ||
        size > 100 ||
        !Number.isSafeInteger(requestedPage) ||
        requestedPage < 1)) ||
    search.length > 100 ||
    !['practice', 'history'].includes(scope)
  ) {
    return c.json(
      {
        error: { code: 'INVALID_FILTER', message: '请检查题库筛选条件。' },
        requestId: c.get('requestId'),
      },
      400,
    );
  }
  const active = new Set(c.get('content').practice.topics.flatMap((t) => t.questionIds));
  const topicIds = topic
    ? new Set(topics.find((item) => item.id === topic)!.questionIds)
    : undefined;
  const matches = questions.filter(
    (q) =>
      (scope === 'history' || active.has(q.id)) &&
      (!requestedIds || requestedIds.has(q.id)) &&
      (!topicIds || topicIds.has(q.id)) &&
      (!unit || q.unitId === unit) &&
      (!difficulty || q.difficulty === difficulty) &&
      (!type || q.type === type) &&
      (!search || `${q.stem}${q.title}`.includes(search)),
  );
  const pageCount = Math.max(1, Math.ceil(matches.length / size));
  const currentPage = Math.min(requestedPage, pageCount);
  const items = paginated ? matches.slice((currentPage - 1) * size, currentPage * size) : matches;
  return c.json(
    envelope(
      {
        items: items.map(publicQuestion),
        total: matches.length,
        ...(paginated ? { page: currentPage, pageSize: size, pageCount } : {}),
      },
      c.get('requestId'),
    ),
  );
});
app.get('/api/v1/questions/:id', (c) => {
  const question = c.get('content').questions.find((q) => q.id === c.req.param('id'));
  if (!question) return c.json({ error: { code: 'NOT_FOUND', message: '没有找到这道题。' } }, 404);
  return c.json(
    envelope(
      {
        items: [publicQuestion(question)],
        total: 1,
        topics: teachingTopics(c.get('content'), [question]),
      },
      c.get('requestId'),
    ),
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
  if (question.sourceIssue)
    return c.json(
      {
        error: { code: 'SOURCE_INCOMPLETE', message: question.sourceIssue },
        requestId: c.get('requestId'),
      },
      422,
    );
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
  const correct = gradeAnswers(question, parsed.data.answers);
  const user = await sessionUser(c.env ?? {}, c.req.raw, (cookie) =>
    c.header('Set-Cookie', cookie, { append: true }),
  );
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
        assisted: question.responseMode === 'selfReview' || (parsed.data.assisted ?? false),
      },
    ]);
  }
  return c.json(
    envelope(
      {
        correct,
        feedback:
          question.responseMode === 'selfReview'
            ? correct
              ? '已记录：核对通过。'
              : '已加入错题，再练一次。'
            : correct
              ? '答对了。'
              : '答案不正确，可修改后重试。',
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
