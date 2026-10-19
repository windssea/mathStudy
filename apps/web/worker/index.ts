import { Hono } from 'hono';
import {
  submissionSchema,
  editionId,
  difficultySchema,
  questionTypeSchema,
} from '@mathstudy/contracts';
import { publicQuestion } from '@mathstudy/content';
import { loadCourseContent, type ContentDatabase, type CourseContent } from './content-repository';
import { sameAnswer } from '@mathstudy/math-core';

const app = new Hono<{
  Bindings: {
    DB?: ContentDatabase;
    CF_VERSION_METADATA?: { id: string; tag?: string; timestamp: string };
  };
  Variables: { requestId: string; content: CourseContent };
}>();
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
app.use('/api/v1/*', async (c, next) => {
  c.set('content', await loadCourseContent(c.env?.DB));
  await next();
});
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
