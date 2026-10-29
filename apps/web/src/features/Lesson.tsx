import { Button } from '../components/ui/button';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { Lesson, QuestionPublic, PracticeTopic } from '@mathstudy/contracts';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { visitLesson, completeLesson, useProgress, useAccount } from '../lib/progress';
import { Icon, Loading, ErrorState } from '../components/ui';
import DemoPlayer from '../components/DemoPlayer';
import GeometryLessonPlayer from '../components/GeometryLessonPlayer';
import QuantityLessonPlayer from '../components/QuantityLessonPlayer';
import ArithmeticLessonPlayer from '../components/ArithmeticLessonPlayer';
import LargeNumberLessonPlayer from '../components/LargeNumberLessonPlayer';
import QuestionDeck from '../components/QuestionDeck';
import SplitWorkspace from '../components/layout/SplitWorkspace';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { LessonNarrationTarget } from '../components/LessonNarration';

export default function LessonPage() {
  const { editionId, lessonId } = useParams();
  const remote = useRemote<{
    lesson: Lesson;
    questions: QuestionPublic[];
    topics: PracticeTopic[];
  }>(`/textbooks/${editionId}/lessons/${lessonId}`);
  if (remote.loading) return <Loading />;
  if (remote.error || !remote.data)
    return <ErrorState message={remote.error ?? '这一课尚未开放'} retry={remote.retry} />;
  return <LessonContent key={remote.data.lesson.id} {...remote.data} />;
}
function LessonContent({
  lesson,
  questions,
  topics = [],
}: {
  lesson: Lesson;
  questions: QuestionPublic[];
  topics?: PracticeTopic[];
}) {
  const { textbook: book } = useCourse();
  const navigate = useNavigate();
  const extension = useRemote<{ items: QuestionPublic[] }>(
    `/questions?unit=${lesson.unitId === 'A01' ? 'U02' : lesson.unitId}`,
  );
  const deeper =
    extension.data?.items.filter(
      (q) =>
        q.lessonId === lesson.id && !lesson.questionIds.includes(q.id) && q.difficulty !== 'basic',
    ) ?? [];
  const progress = useProgress();
  useAccount();
  const [tab, setTab] = useState('explore');
  const [explored, setExplored] = useState(false);
  const [attempted, setAttempted] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [narrationTarget, setNarrationTarget] = useState<HTMLDivElement | null>(null);
  const onExplored = useCallback((done: boolean) => setExplored(done), []);
  const onAttempt = (id: string) => setAttempted((a) => (a.includes(id) ? a : [...a, id]));
  const node = book.catalog.find((n) => n.id === lesson.unitId)!;
  const unitLabel =
    node.kind === 'unit'
      ? `第${['一', '二', '三', '四', '五', '六'][Number(node.id.slice(1)) - 1]}单元`
      : '动手探索';
  const available = node.lessons.filter((l) => l.available);
  const lessonIndex = available.findIndex((l) => l.id === lesson.id);
  const all = book.catalog.flatMap((n) => n.lessons).filter((l) => l.available);
  const next = all[all.findIndex((l) => l.id === lesson.id) + 1];
  const completed = progress.completed.includes(lesson.id);
  const ready = explored && attempted.length >= questions.length;
  useEffect(() => visitLesson(lesson.id), [lesson.id]);
  const player =
    'dividend' in lesson.demo ? (
      <DemoPlayer demo={lesson.demo} onExplored={onExplored} />
    ) : 'unitValue' in lesson.demo ? (
      <QuantityLessonPlayer demo={lesson.demo} onExplored={onExplored} />
    ) : 'exampleId' in lesson.demo ? (
      <ArithmeticLessonPlayer demo={lesson.demo} onExplored={onExplored} />
    ) : 'initialNumber' in lesson.demo ? (
      <LargeNumberLessonPlayer demo={lesson.demo} onExplored={onExplored} />
    ) : (
      <GeometryLessonPlayer demo={lesson.demo} onExplored={onExplored} />
    );
  return (
    <div className="lesson-page">
      <header className="lesson-page-header">
        <Link className="icon-button" aria-label="返回课程目录" to={`/books/${book.id}`}>
          <Icon name="ArrowLeft" />
        </Link>
        <div className="lesson-title">
          <span className="lesson-location">
            {unitLabel} · 第 {lessonIndex + 1} 课
          </span>
          <h1>{lesson.title}</h1>
        </div>
        <label className="lesson-picker">
          <span className="sr-only">本单元课节</span>
          <select
            value={lesson.id}
            onChange={(e) => navigate(`/books/${book.id}/lessons/${e.target.value}`)}
          >
            {available.map((l, i) => (
              <option key={l.id} value={l.id}>
                {i + 1}. {l.title}
              </option>
            ))}
          </select>
        </label>
      </header>
      <Tabs value={tab} onValueChange={setTab} className="lesson-screen">
        <div className="lesson-modebar">
          <TabsList aria-label="学习方式">
            <TabsTrigger value="explore">
              <Icon name="Shapes" size={17} />
              动手学一学{explored && <Icon name="Check" size={16} />}
            </TabsTrigger>
            <TabsTrigger value="practice">
              <Icon name="NotebookPen" size={17} />
              自己试一试
              <span className="tab-count">
                {attempted.length}/{questions.length}
              </span>
            </TabsTrigger>
          </TabsList>
          <Link
            className="text-link"
            to={`/questions?unit=${questions[0]?.unitId ?? lesson.unitId}`}
          >
            进入本单元题库 <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
        <TabsContent
          value="explore"
          forceMount
          hidden={tab !== 'explore'}
          className="lesson-explore"
        >
          <LessonNarrationTarget.Provider value={narrationTarget}>
            <SplitWorkspace
              initialSize={65}
              primaryLabel="交互演示"
              secondaryLabel="本课要点"
              className="lesson-split"
              primary={player}
              secondary={
                <aside className="lesson-notes pane-scroll" tabIndex={0}>
                  <div className="lesson-current-step" ref={setNarrationTarget} />
                  <div className="pane-label">
                    <Icon name="Lightbulb" size={17} />
                    本课要点
                  </div>
                  <section className="lesson-knowledge" aria-label="本课知识说明">
                    {lesson.concepts.map((c) => (
                      <details key={c.title}>
                        <summary>{c.title}</summary>
                        <p>{c.text}</p>
                      </details>
                    ))}
                  </section>
                  <div className="learning-checklist">
                    <div data-done={explored}>
                      <Icon name={explored ? 'CheckCircle2' : 'Play'} size={18} />
                      <span>完成演示</span>
                    </div>
                    <div data-done={attempted.length >= questions.length}>
                      <Icon
                        name={attempted.length >= questions.length ? 'CheckCircle2' : 'NotebookPen'}
                        size={18}
                      />
                      <span>本课练习</span>
                      <b>
                        {attempted.length}/{questions.length}
                      </b>
                    </div>
                  </div>
                  {deeper.length > 0 && (
                    <details className="lesson-more">
                      <summary>进一步练习</summary>
                      {deeper.map((q) => (
                        <Link key={q.id} className="text-link" to={`/questions/${q.id}`}>
                          {q.title}
                          <Icon name="ArrowRight" size={16} />
                        </Link>
                      ))}
                    </details>
                  )}
                </aside>
              }
            />
          </LessonNarrationTarget.Provider>
        </TabsContent>
        <TabsContent
          value="practice"
          forceMount
          hidden={tab !== 'practice'}
          className="lesson-practice"
        >
          {questions.length ? (
            <>
              <div className="session-toolbar">
                <label className="lesson-question-picker">
                  <span className="sr-only">跳转本课题目</span>
                  <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
                    {questions.map((q, i) => (
                      <option value={i} key={q.id}>
                        第{i + 1}题 · {q.title}
                        {attempted.includes(q.id) ? ' (已作答)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <span>
                  第 {index + 1} / {questions.length} 题
                </span>
              </div>
              <QuestionDeck items={questions} index={index} onAttempt={onAttempt} topics={topics} />
            </>
          ) : (
            <div className="empty-state">
              <h2>本课暂无练习</h2>
              <p>完成演示即可记录学习进度。</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      <footer className="session-footer lesson-footer">
        {tab === 'practice' && questions.length > 0 ? (
          <>
            <Button
              variant="outline"
              className="button secondary"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              <Icon name="ArrowLeft" size={17} />
              上一题
            </Button>
            <span className="session-footer-note">
              {attempted.length === questions.length
                ? '本课练习已完成'
                : `已尝试 ${attempted.length} / ${questions.length} 题`}
            </span>
            {index < questions.length - 1 && (
              <Button
                variant="default"
                className="button primary"
                onClick={() => setIndex(index + 1)}
              >
                下一题
                <Icon name="ArrowRight" size={17} />
              </Button>
            )}
            {index === questions.length - 1 && !ready && !completed && (
              <Button
                variant="outline"
                className="button secondary"
                onClick={() => setTab('explore')}
              >
                返回演示
              </Button>
            )}
          </>
        ) : (
          <>
            <span className="lesson-page-ref">课本 p.{lesson.pages.join('-')}</span>
            <span className="session-footer-note">
              {explored ? '演示已完成，试着独立作答' : '点击下一步，观察变化'}
            </span>
            {!completed && !ready && (
              <Button
                variant="default"
                className="button primary"
                onClick={() => setTab('practice')}
              >
                开始练习
                <Icon name="ArrowRight" size={17} />
              </Button>
            )}
          </>
        )}
        {completed ? (
          <Link
            className="button primary"
            to={
              next
                ? `/books/${book.id}/lessons/${next.id}`
                : `/questions?unit=${questions[0]?.unitId ?? lesson.unitId}`
            }
          >
            <Icon name="CheckCircle2" size={17} />
            {next ? '继续下一课' : '再练本单元'}
          </Link>
        ) : ready ? (
          <Button
            variant="default"
            className="button primary"
            onClick={() => completeLesson(lesson.id)}
          >
            完成本课
            <Icon name="Check" size={17} />
          </Button>
        ) : (
          tab === 'practice' &&
          index === questions.length - 1 && (
            <Button
              variant="default"
              className="button primary"
              disabled
              title="完成演示并尝试全部练习后可记录完成"
            >
              完成本课
            </Button>
          )
        )}
      </footer>
    </div>
  );
}
