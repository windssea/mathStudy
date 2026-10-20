import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { Lesson, QuestionPublic } from '@mathstudy/contracts';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { visitLesson, completeLesson, useProgress, useAccount } from '../lib/progress';
import { Icon, Loading, ErrorState } from '../components/ui';
import DemoPlayer from '../components/DemoPlayer';
import GeometryLessonPlayer from '../components/GeometryLessonPlayer';
import QuantityLessonPlayer from '../components/QuantityLessonPlayer';
import ArithmeticLessonPlayer from '../components/ArithmeticLessonPlayer';
import LargeNumberLessonPlayer from '../components/LargeNumberLessonPlayer';
import QuestionRunner from '../components/QuestionRunner';

export default function LessonPage() {
  const { editionId, lessonId } = useParams();
  const remote = useRemote<{ lesson: Lesson; questions: QuestionPublic[] }>(
    `/textbooks/${editionId}/lessons/${lessonId}`,
  );
  if (remote.loading) return <Loading />;
  if (remote.error || !remote.data)
    return <ErrorState message={remote.error ?? '这一课尚未开放'} retry={remote.retry} />;
  return (
    <LessonContent
      key={remote.data.lesson.id}
      lesson={remote.data.lesson}
      questions={remote.data.questions}
    />
  );
}
function LessonContent({ lesson, questions }: { lesson: Lesson; questions: QuestionPublic[] }) {
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
  const [tab, setTab] = useState<'explore' | 'practice'>('explore');
  const [explored, setExplored] = useState(false);
  const [attempted, setAttempted] = useState<string[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const onExplored = useCallback((done: boolean) => setExplored(done), []);
  const node = book.catalog.find((n) => n.id === lesson.unitId)!;
  const unitLabel =
    node.kind === 'unit'
      ? `第${['一', '二', '三', '四', '五', '六'][Number(node.id.slice(1)) - 1]}单元`
      : '动手探索';
  const available = node.lessons.filter((l) => l.available);
  const index = available.findIndex((l) => l.id === lesson.id);
  const all = book.catalog.flatMap((n) => n.lessons).filter((l) => l.available);
  const next = all[all.findIndex((l) => l.id === lesson.id) + 1];
  const completed = progress.completed.includes(lesson.id);
  useEffect(() => visitLesson(lesson.id), [lesson.id]);
  function finish() {
    completeLesson(lesson.id);
    setCelebrating(true);
  }
  return (
    <>
      <Link className="back-link" to={`/books/${book.id}`}>
        <Icon name="ArrowLeft" size={16} />
        返回课程目录
      </Link>
      <div className="lesson-title">
        <div className="eyebrow">
          {unitLabel} · 第 {index + 1} 课<span>课本 p.{lesson.pages.join('–')}</span>
        </div>
        <h1>{lesson.title}</h1>
      </div>
      <div className="lesson-navigation">
        <label>
          本单元课节
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
        <Link className="text-link" to={`/questions?unit=${questions[0]?.unitId ?? lesson.unitId}`}>
          进入本单元题库 <Icon name="ArrowRight" size={16} />
        </Link>
      </div>
      <div className="lesson-layout">
        <div className="lesson-content">
          <div className="lesson-tabs" role="tablist" aria-label="学习方式">
            <button
              role="tab"
              aria-selected={tab === 'explore'}
              aria-controls="explore-panel"
              id="explore-tab"
              onClick={() => setTab('explore')}
            >
              <Icon name="Shapes" size={19} />
              动手学一学{explored && <Icon name="Check" size={16} />}
            </button>
            <button
              role="tab"
              aria-selected={tab === 'practice'}
              aria-controls="practice-panel"
              id="practice-tab"
              onClick={() => setTab('practice')}
            >
              <Icon name="NotebookPen" size={19} />
              自己试一试
              <span>
                {attempted.length}/{questions.length}
              </span>
            </button>
          </div>
          <div
            role="tabpanel"
            id="explore-panel"
            aria-labelledby="explore-tab"
            hidden={tab !== 'explore'}
          >
            <section className="lesson-knowledge" aria-label="本课知识说明">
              <h2>知识说明</h2>
              {lesson.concepts.map((c) => (
                <div key={c.title}>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </div>
              ))}
            </section>
            {'dividend' in lesson.demo ? (
              <DemoPlayer demo={lesson.demo} onExplored={onExplored} />
            ) : 'unitValue' in lesson.demo ? (
              <QuantityLessonPlayer demo={lesson.demo} onExplored={onExplored} />
            ) : 'exampleId' in lesson.demo ? (
              <ArithmeticLessonPlayer demo={lesson.demo} onExplored={onExplored} />
            ) : 'initialNumber' in lesson.demo ? (
              <LargeNumberLessonPlayer demo={lesson.demo} onExplored={onExplored} />
            ) : (
              <GeometryLessonPlayer demo={lesson.demo} onExplored={onExplored} />
            )}
          </div>
          <div
            role="tabpanel"
            id="practice-panel"
            aria-labelledby="practice-tab"
            hidden={tab !== 'practice'}
          >
            <h2 className="practice-title">本课练习</h2>
            {questions.map((q) => (
              <div className="practice-question panel" key={q.id}>
                <QuestionRunner
                  question={q}
                  onAttempt={(id) => setAttempted((a) => (a.includes(id) ? a : [...a, id]))}
                />
              </div>
            ))}
            {deeper.length > 0 && (
              <section className="lesson-extension panel">
                <h2>进一步练习</h2>
                {deeper.map((q) => (
                  <Link key={q.id} className="text-link" to={`/questions/${q.id}`}>
                    {q.title} <Icon name="ArrowRight" size={16} />
                  </Link>
                ))}
              </section>
            )}
            <section className="lesson-finish panel">
              {celebrating || completed ? (
                <>
                  <span className="finish-icon">
                    <Icon name="CheckCircle2" size={32} />
                  </span>
                  <h2>本课已完成</h2>
                  <p>学习记录已保存。</p>
                  <Link
                    className="button primary"
                    to={
                      next
                        ? `/books/${book.id}/lessons/${next.id}`
                        : `/questions?unit=${questions[0]?.unitId ?? lesson.unitId}`
                    }
                  >
                    {next ? '继续下一课' : '再练本单元'}
                    <Icon name="ArrowRight" size={17} />
                  </Link>
                </>
              ) : (
                <>
                  <h2>记录本课完成</h2>
                  <p>
                    {!explored
                      ? '请完成演示或阅读静态步骤。'
                      : attempted.length < questions.length
                        ? '请尝试本课全部练习。'
                        : '演示与练习均已完成。'}
                  </p>
                  <button
                    className="button primary"
                    disabled={!explored || attempted.length < questions.length}
                    onClick={finish}
                  >
                    完成本课
                    <Icon name="Check" size={17} />
                  </button>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
