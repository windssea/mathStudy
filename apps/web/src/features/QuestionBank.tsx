import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { QuestionPublic, PracticeTopic, PracticeCatalog } from '@mathstudy/contracts';
import { difficultyLabels, typeLabels } from '@mathstudy/contracts';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { useProgress } from '../lib/progress';
import { answerStatus } from '../lib/answer-status';
import { safeReturnTo } from '../lib/navigation';
import { Icon, Loading, ErrorState } from '../components/ui';
import { GridFigureView } from '../components/GridExercise';
import QuestionRunner from '../components/QuestionRunner';

type BankResult = {
  items: QuestionPublic[];
  total: number;
  page?: number;
  pageCount?: number;
  topics?: PracticeTopic[];
};

export default function QuestionBank() {
  const { questionId } = useParams();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { textbook: book } = useCourse();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const searchParam = params.get('search') ?? '';
  useEffect(() => setSearch(searchParam), [searchParam]);
  const progress = useProgress();
  const unit = params.get('unit') ?? '';
  const difficulty = params.get('difficulty') ?? '';
  const type = params.get('type') ?? '';
  const topic = params.get('topic') ?? '';
  const apiParams = new URLSearchParams({ page: params.get('page') ?? '1', pageSize: '12' });
  for (const [key, value] of Object.entries({
    unit,
    difficulty,
    type,
    topic,
    search: searchParam,
  })) {
    if (value) apiParams.set(key, value);
  }
  const remote = useRemote<BankResult>(
    `/questions${questionId ? `/${questionId}` : `?${apiParams}`}`,
  );
  const catalog = useRemote<PracticeCatalog>(questionId ? null : '/practice');
  function filter(key: string, value: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('page');
      next.delete('preview');
      if (key === 'unit') next.delete('topic');
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }
  const question = remote.data?.items.find((q) => q.id === questionId);
  const pageCount = remote.data?.pageCount ?? 1;
  const page = remote.data?.page ?? 1;
  const selected =
    remote.data?.items.find((q) => q.id === params.get('preview')) ?? remote.data?.items[0];
  if (questionId) {
    if (remote.loading) return <Loading />;
    if (!question || remote.error) return <ErrorState message={remote.error ?? '没有找到这道题'} />;
    const unitNode = book.catalog.find((n) => n.id === question.unitId);
    const fallback = `/questions?unit=${question.unitId}`;
    const origin = safeReturnTo(params.get('returnTo'), fallback);
    const back = /^\/(?:questions|records)(?:[?#]|$)/.test(origin) ? origin : fallback;
    return (
      <div className="question-detail-page">
        <header className="question-detail-header">
          <Link to={back} className="back-link">
            <Icon name="ArrowLeft" size={16} />
            {back.startsWith('/records') ? '返回记录' : '返回题库'}
          </Link>
          <p className="question-unit-label">{unitNode?.title}</p>
        </header>
        <div className="question-detail">
          <QuestionRunner
            key={question.id}
            question={question}
            standalone
            method={remote.data?.topics?.find((t) => question.topicIds?.includes(t.id))}
          />
        </div>
      </div>
    );
  }
  function changePage(nextPage: number) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('page', String(nextPage));
      next.delete('preview');
      return next;
    });
  }
  const openParams = new URLSearchParams({ returnTo: `${location.pathname}${location.search}` });
  return (
    <div className="bank-page">
      <div className="page-heading">
        <h1>全部题目</h1>
      </div>
      <section className="bank-filters panel" aria-label="筛选题目">
        <div className="bank-filter-row">
          <label>
            单元
            <select value={unit} onChange={(e) => filter('unit', e.target.value)}>
              <option value="">全部单元</option>
              {book.catalog
                .filter((n) => n.kind === 'unit')
                .map((n) => (
                  <option value={n.id} key={n.id}>
                    {n.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            解题类型
            <select value={topic} onChange={(e) => filter('topic', e.target.value)}>
              <option value="">全部类型</option>
              {catalog.data?.topics
                .filter((t) => !unit || t.unitId === unit)
                .map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            难度
            <select value={difficulty} onChange={(e) => filter('difficulty', e.target.value)}>
              <option value="">全部难度</option>
              {Object.entries(difficultyLabels).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            作答形式
            <select value={type} onChange={(e) => filter('type', e.target.value)}>
              <option value="">全部形式</option>
              {Object.entries(typeLabels).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <form
            className="bank-search"
            onSubmit={(e) => {
              e.preventDefault();
              filter('search', search.trim());
            }}
          >
            <label className="search-box">
              <Icon name="Search" size={18} />
              <Input
                aria-label="搜索题目"
                placeholder="搜索题目"
                maxLength={100}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <Button variant="outline" type="submit">
              搜索
            </Button>
          </form>
        </div>
      </section>
      {remote.loading ? (
        <Loading />
      ) : remote.error ? (
        <ErrorState message={remote.error} retry={remote.retry} />
      ) : !remote.data?.total ? (
        <div className="empty-state">
          <Icon name="Search" size={32} />
          <h2>这个组合暂时没有题目</h2>
          <p>放宽难度或解题类型，再试一次。</p>
          <Button
            variant="outline"
            onClick={() => {
              setParams({});
              setSearch('');
            }}
          >
            重置筛选
          </Button>
        </div>
      ) : (
        <div className="bank-workspace">
          <section className="bank-list-pane panel" aria-label="题目列表">
            <div className="bank-result-heading">共 {remote.data.total} 道题 · 选择题目预览</div>
            <div className="bank-question-list">
              {remote.data.items.map((q) => (
                <button
                  key={q.id}
                  className="bank-question-row"
                  aria-pressed={selected?.id === q.id}
                  onClick={() =>
                    setParams(
                      (previous) => {
                        const next = new URLSearchParams(previous);
                        next.set('preview', q.id);
                        return next;
                      },
                      { replace: true },
                    )
                  }
                >
                  <span className="question-meta">
                    <span className={`chip difficulty-${q.difficulty}`}>
                      {difficultyLabels[q.difficulty]}
                    </span>
                    <span>{typeLabels[q.type]}</span>
                    {progress.answers[q.id] && (
                      <span className="question-done">
                        {answerStatus(
                          progress.answers[q.id],
                          progress.history.find((attempt) => attempt.questionId === q.id),
                        )}
                      </span>
                    )}
                  </span>
                  <strong>{q.title}</strong>
                  <span className="bank-row-stem">{q.stem}</span>
                </button>
              ))}
            </div>
            <nav className="bank-pagination" aria-label="题库分页">
              <Button variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>
                上一组
              </Button>
              <span>
                {page} / {pageCount}
              </span>
              <Button
                variant="outline"
                disabled={page >= pageCount}
                onClick={() => changePage(page + 1)}
              >
                下一组
              </Button>
            </nav>
          </section>
          {selected && (
            <section className="bank-preview-pane panel" aria-label="题目预览">
              <div className="bank-preview-content">
                <div className="question-meta">
                  <span className={`chip difficulty-${selected.difficulty}`}>
                    {difficultyLabels[selected.difficulty]}
                  </span>
                  <span>{typeLabels[selected.type]}</span>
                </div>
                <h2>{selected.title}</h2>
                {selected.stem !== selected.title && (
                  <p className="question-stem">{selected.stem}</p>
                )}
                {selected.promptImage && (
                  <img
                    className="question-diagram"
                    src={selected.promptImage.src}
                    alt={selected.promptImage.alt}
                  />
                )}
                {selected.figure && <GridFigureView figure={selected.figure} />}
              </div>
              <Link className="button primary" to={`/questions/${selected.id}?${openParams}`}>
                开始练习
                <Icon name="ArrowRight" size={18} />
              </Link>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
