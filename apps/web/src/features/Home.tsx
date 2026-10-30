import { Link, useSearchParams } from 'react-router-dom';
import {
  difficultyLabels,
  typeLabels,
  teachingGroupLabels,
  type PracticeCatalog,
} from '@mathstudy/contracts';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { useProgress } from '../lib/progress';
import { Icon, Loading, ErrorState } from '../components/ui';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import TopicMethod, { UnitMethodMap } from '../components/TopicMethod';

export default function Home() {
  const { textbook: book } = useCourse();
  const [params, setParams] = useSearchParams();
  const unit = params.get('unit') ?? 'U01';
  const difficulty = params.get('difficulty') ?? '',
    type = params.get('type') ?? '';
  const selection = new URLSearchParams();
  if (difficulty) selection.set('difficulty', difficulty);
  if (type) selection.set('type', type);
  const remote = useRemote<PracticeCatalog>(`/practice?${selection}`);
  const progress = useProgress();
  function filter(key: string, value: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('view');
      if (key === 'unit') next.delete('method');
      if (value || key === 'unit') next.set(key, value);
      else next.delete(key);
      return next;
    });
  }
  if (remote.loading) return <Loading />;
  if (remote.error || !remote.data)
    return <ErrorState message={remote.error ?? '加载失败'} retry={remote.retry} />;
  const topics = remote.data.topics.filter(
    (t) => (!unit || t.unitId === unit) && t.questionIds.length,
  );
  const units = book.catalog.filter((n) => n.kind === 'unit');
  const current = units.find((n) => n.id === unit);
  const selectedTopic = topics.find((t) => t.id === params.get('method')) ?? topics[0];
  const unitMethod = remote.data.units.find((u) => u.unitId === (selectedTopic?.unitId ?? unit));
  const view = params.get('view') === 'methods' && topics.length ? 'methods' : 'practice';
  function showMethod(id: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('view', 'methods');
      next.set('method', id);
      return next;
    });
  }
  function chooseUnit(value: string) {
    if (view !== 'methods') {
      filter('unit', value);
      return;
    }
    const first = remote.data?.topics.find(
      (topic) => (!value || topic.unitId === value) && topic.questionIds.length,
    );
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('unit', value);
      next.set('view', 'methods');
      if (first) next.set('method', first.id);
      else next.delete('method');
      return next;
    });
  }
  return (
    <div className={`home-page ${view === 'methods' ? 'is-teaching' : ''}`}>
      <div className={view === 'methods' ? 'sr-only' : 'practice-page-head'}>
        <h1>数学题库</h1>
        <span>苏教版 · 四年级上册</span>
      </div>
      <div className="collection-layout">
        <aside className="collection-nav" aria-label="选择练习单元">
          <h2>按单元练习</h2>
          {units.map((n, i) => (
            <button
              className={unit === n.id ? 'selected' : ''}
              aria-pressed={unit === n.id}
              onClick={() => chooseUnit(n.id)}
              key={n.id}
            >
              <span className="unit-index" data-tone={i % 4}>
                {i + 1}
              </span>
              <span>{n.title}</span>
              <Icon name="ChevronRight" size={15} />
            </button>
          ))}
          <button
            className={!unit ? 'selected all-units' : 'all-units'}
            aria-pressed={!unit}
            onClick={() => chooseUnit('')}
          >
            <Icon name="Grid2X2" size={18} />
            <span>全部单元</span>
          </button>
          <Link className="collection-review" to="/records">
            <Icon name="RotateCcw" size={18} />
            错题与记录
            <Icon name="ArrowRight" size={16} />
          </Link>
        </aside>
        <section className="collection-content">
          <div className="collection-heading">
            <h2>{current?.title ?? '全部专题'}</h2>
            <Link className="text-link" to={`/books/${book.id}${unit ? `#${unit}` : ''}`}>
              知识讲解
              <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
          <div className="collection-filters" hidden={view === 'methods'}>
            <label>
              作答形式
              <select value={type} onChange={(e) => filter('type', e.target.value)}>
                <option value="">全部形式</option>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              难度
              <select value={difficulty} onChange={(e) => filter('difficulty', e.target.value)}>
                <option value="">全部难度</option>
                {Object.entries(difficultyLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <span>{topics.length} 类题</span>
            {(difficulty || type) && (
              <Button
                variant="ghost"
                onClick={() => {
                  const next = new URLSearchParams();
                  next.set('unit', unit);
                  setParams(next);
                }}
              >
                重置
              </Button>
            )}
          </div>
          <Tabs
            className={`teaching-catalog ${view === 'methods' ? 'is-method-view' : ''}`}
            value={view}
            onValueChange={(value) =>
              setParams((previous) => {
                const next = new URLSearchParams(previous);
                if (value === 'methods') next.set('view', value);
                else next.delete('view');
                return next;
              })
            }
          >
            <div className="teaching-controls">
              <TabsList aria-label="题型与方法">
                <TabsTrigger value="practice">题型练习</TabsTrigger>
                <TabsTrigger value="methods" disabled={!topics.length}>
                  单元方法
                </TabsTrigger>
              </TabsList>
              {view === 'methods' && selectedTopic?.guide && (
                <>
                  <label className="method-unit-picker">
                    <span className="sr-only">选择方法单元</span>
                    <select
                      aria-label="选择方法单元"
                      value={unit}
                      onChange={(e) => chooseUnit(e.target.value)}
                    >
                      <option value="">全部单元</option>
                      {units.map((n, i) => (
                        <option
                          value={n.id}
                          key={n.id}
                          disabled={
                            !remote.data?.topics.some(
                              (topic) => topic.unitId === n.id && topic.questionIds.length,
                            )
                          }
                        >
                          第{i + 1}单元
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="method-topic-picker">
                    <span className="sr-only">题型方法</span>
                    <select value={selectedTopic.id} onChange={(e) => showMethod(e.target.value)}>
                      {topics.map((t) => (
                        <option value={t.id} key={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  {unitMethod && <UnitMethodMap unit={unitMethod} />}
                  <Button asChild>
                    <Link to={`/practice/topics/${selectedTopic.id}?${selection}`}>
                      练这类题
                      <Icon name="ArrowRight" size={16} />
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <TabsContent value="practice" className="topic-groups pane-scroll">
              <div className="topic-list topic-learning-sequence">
                {topics.map((t) => {
                  const group = t.guide?.group ?? 'foundation';
                  const tone = Math.max(0, Object.keys(teachingGroupLabels).indexOf(group));
                  return (
                    <section className="practice-entry teaching-topic-card" key={t.id}>
                      <span className="practice-entry-icon" data-tone={tone}>
                        <Icon
                          name={(['Lightbulb', 'NotebookPen', 'Target'] as const)[tone % 3]}
                          size={21}
                        />
                      </span>
                      <div className="topic-card-copy">
                        <h4>{t.title}</h4>
                        <p>{t.guide?.recognize}</p>
                        <span>
                          {teachingGroupLabels[group as keyof typeof teachingGroupLabels]} ·
                          独立答对{' '}
                          {
                            t.questionIds.filter(
                              (id) =>
                                progress.answers[id]?.independentCorrect &&
                                !progress.answers[id]?.needsReview,
                            ).length
                          }
                          /{t.questionIds.length}题
                        </span>
                      </div>
                      <div className="topic-card-actions">
                        <Button variant="ghost" onClick={() => showMethod(t.id)}>
                          学方法
                        </Button>
                        <Button asChild>
                          <Link to={`/practice/topics/${t.id}?${selection}`}>
                            练习
                            <Icon name="ArrowRight" size={16} />
                          </Link>
                        </Button>
                      </div>
                    </section>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="methods" className="method-library">
              {selectedTopic?.guide && (
                <>
                  <div className="method-library-body pane-scroll">
                    <TopicMethod
                      topicId={selectedTopic.id}
                      title={selectedTopic.title}
                      guide={selectedTopic.guide}
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
          {topics.length === 0 && (
            <div className="empty-state">
              <Icon name="Search" size={28} />
              <h3>没有符合条件的题目</h3>
              <p>调整题型或难度后再试。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
