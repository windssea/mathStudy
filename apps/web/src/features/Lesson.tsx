import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Lesson, QuestionPublic } from '@mathstudy/contracts';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import {
  visitLesson,
  completeLesson,
  useProgress,
  useAccount,
  progressMessage,
} from '../lib/progress';
import { Icon, Loading, ErrorState } from '../components/ui';
import DemoPlayer from '../components/DemoPlayer';
import GeometryLessonPlayer from '../components/GeometryLessonPlayer';
import QuantityLessonPlayer from '../components/QuantityLessonPlayer';
import ArithmeticLessonPlayer from '../components/ArithmeticLessonPlayer';
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
        <p>{lesson.summary}</p>
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
            {'dividend' in lesson.demo ? (
              <DemoPlayer demo={lesson.demo} onExplored={onExplored} />
            ) : 'unitValue' in lesson.demo ? (
              <QuantityLessonPlayer demo={lesson.demo} onExplored={onExplored} />
            ) : 'exampleId' in lesson.demo ? (
              <ArithmeticLessonPlayer demo={lesson.demo} onExplored={onExplored} />
            ) : (
              <GeometryLessonPlayer demo={lesson.demo} onExplored={onExplored} />
            )}
            <section className="concept-section">
              <div className="section-heading">
                <div>
                  <Icon name="Lightbulb" />
                  <h2>把发现记下来</h2>
                </div>
              </div>
              {lesson.concepts.map((c, i) => (
                <div className="concept-block" key={c.title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </div>
                </div>
              ))}
              <button
                className="button primary"
                onClick={() => {
                  setTab('practice');
                  window.scrollTo({ top: 150, behavior: 'instant' });
                }}
              >
                理解了，做几道题
                <Icon name="ArrowRight" size={18} />
              </button>
            </section>
          </div>
          <div
            role="tabpanel"
            id="practice-panel"
            aria-labelledby="practice-tab"
            hidden={tab !== 'practice'}
          >
            <div className="practice-intro">
              <h2>自己想一想，再动笔</h2>
              <p>遇到困难可以先看提示，难题还能一步一步看图解。</p>
            </div>
            {questions.map((q) => (
              <div className="practice-question panel" key={q.id}>
                <QuestionRunner
                  question={q}
                  onAttempt={(id) => setAttempted((a) => (a.includes(id) ? a : [...a, id]))}
                />
              </div>
            ))}
            <section className="lesson-finish panel">
              {celebrating || completed ? (
                <>
                  <span className="finish-icon">
                    <Icon name="CheckCircle2" size={32} />
                  </span>
                  <h2>这一课，又多懂了一点</h2>
                  <p>
                    {progressMessage()}
                    你可以继续探索下一课。
                  </p>
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
                  <h2>回顾一下，今天的收获</h2>
                  <p>
                    {!explored
                      ? '先把交互演示看到最后一步，或阅读静态步骤。'
                      : attempted.length < questions.length
                        ? '完成上面的练习尝试，就可以记录这一课的学习。'
                        : '完成了探索与练习，为这一课画一个小句号吧。'}
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
        <aside className="lesson-aside">
          <section className="panel lesson-goals">
            <div className="small-panel-heading">
              <h2>这节课的小目标</h2>
              <Icon name="Target" />
            </div>
            <ol>
              {lesson.goals.map((g, i) => (
                <li key={g}>
                  <span>{i + 1}</span>
                  {g}
                </li>
              ))}
            </ol>
            <div className="lesson-time">
              <Icon name="Clock3" size={17} />约 {lesson.minutes} 分钟 · 按自己的节奏学
            </div>
          </section>
          <section className="panel unit-roadmap">
            <h2>{unitLabel}的探索路线</h2>
            {available.map((l, i) => (
              <Link
                className={l.id === lesson.id ? 'current' : ''}
                to={`/books/${book.id}/lessons/${l.id}`}
                key={l.id}
              >
                <span>
                  {progress.completed.includes(l.id) ? <Icon name="Check" size={13} /> : i + 1}
                </span>
                <span>{l.title}</span>
                {l.id === lesson.id && <Icon name="Play" size={12} />}
              </Link>
            ))}
          </section>
          <Link
            className="unit-practice-link"
            to={`/questions?unit=${questions[0]?.unitId ?? lesson.unitId}`}
          >
            <Icon name="NotebookPen" size={18} />
            进入本单元题库
            <Icon name="ArrowRight" size={16} />
          </Link>
          <div className="gentle-note">
            <Icon name="Lightbulb" size={24} />
            <p>
              会做一道题很棒，
              <br />
              <b>能讲清为什么更棒。</b>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
