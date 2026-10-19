import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import type { QuestionPublic } from '@mathstudy/contracts';
import { difficultyLabels, typeLabels } from '@mathstudy/contracts';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { useProgress } from '../lib/progress';
import { Icon, Loading, ErrorState } from '../components/ui';
import QuestionRunner from '../components/QuestionRunner';

export default function QuestionBank() {
  const { questionId } = useParams();
  const [params, setParams] = useSearchParams();
  const { textbook: book, questionCount } = useCourse();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const progress = useProgress();
  const unit = params.get('unit') ?? '',
    difficulty = params.get('difficulty') ?? '',
    type = params.get('type') ?? '';
  const apiParams = new URLSearchParams();
  if (unit) apiParams.set('unit', unit);
  if (difficulty) apiParams.set('difficulty', difficulty);
  if (type) apiParams.set('type', type);
  if (params.get('search')) apiParams.set('search', params.get('search')!);
  const remote = useRemote<{ items: QuestionPublic[]; total: number }>(
    `/questions${questionId ? '' : `?${apiParams.toString()}`}`,
  );
  const question = remote.data?.items.find((q) => q.id === questionId);
  function filter(key: string, value: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }
  if (questionId) {
    if (remote.loading) return <Loading />;
    if (!question || remote.error) return <ErrorState message={remote.error ?? '没有找到这道题'} />;
    const unitNode = book.catalog.find((n) => n.id === question.unitId);
    return (
      <>
        <Link to={`/questions?unit=${question.unitId}`} className="back-link">
          <Icon name="ArrowLeft" size={16} />
          返回本单元题库
        </Link>
        <div className="page-heading">
          <div>
            <div className="eyebrow">{unitNode?.title} · 原创练习</div>
            <h1>把问题，一步步想明白</h1>
            <p>先独立尝试，再看看分析。挑战题可以动手切换图解步骤。</p>
          </div>
        </div>
        <div className="question-detail panel">
          <QuestionRunner key={question.id} question={question} />
        </div>
      </>
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">练习，是另一种发现</div>
          <h1>分层题库</h1>
          <p>{questionCount} 道原创题，覆盖本册六个单元。每题都有分析，挑战题配分步图解。</p>
        </div>
        <span className="term-tag">
          <Icon name="Shapes" size={17} />
          难题也能看得懂
        </span>
      </div>
      <section className="bank-filters panel">
        <div className="unit-filter" role="group" aria-label="按单元筛选">
          <button className={!unit ? 'active' : ''} onClick={() => filter('unit', '')}>
            全部单元
          </button>
          {book.catalog
            .filter((n) => n.kind === 'unit')
            .map((n, i) => (
              <button
                className={unit === n.id ? 'active' : ''}
                onClick={() => filter('unit', n.id)}
                key={n.id}
              >
                第{['一', '二', '三', '四', '五', '六'][i]}单元
              </button>
            ))}
        </div>
        <div className="bank-filter-row">
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
            题型
            <select value={type} onChange={(e) => filter('type', e.target.value)}>
              <option value="">全部题型</option>
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
              filter('search', search);
            }}
          >
            <label className="search-box">
              <Icon name="Search" size={18} />
              <input
                aria-label="搜索题目"
                placeholder="搜索题目或知识点"
                maxLength={100}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button className="button secondary" type="submit">
              搜索
            </button>
          </form>
        </div>
      </section>
      <div className="bank-result-heading">
        <span>
          共 <b>{remote.data?.total ?? '…'}</b> 道题
        </span>
        <span>
          <Icon name="Lightbulb" size={16} />
          基础打底，进阶巩固，挑战拓展
        </span>
      </div>
      {remote.loading ? (
        <Loading />
      ) : remote.error ? (
        <ErrorState message={remote.error} retry={remote.retry} />
      ) : (
        <>
          <div className="question-grid">
            {remote.data?.items.map((q) => (
              <Link className="question-card panel" to={`/questions/${q.id}`} key={q.id}>
                <div className="question-meta">
                  <span className={`chip difficulty-${q.difficulty}`}>
                    {difficultyLabels[q.difficulty]}
                  </span>
                  <span className="question-type">{typeLabels[q.type]}</span>
                  {progress.answers[q.id] && (
                    <span className="question-done">
                      <Icon
                        name={progress.answers[q.id].correct ? 'CheckCircle2' : 'RotateCcw'}
                        size={17}
                      />
                      {progress.answers[q.id].correct ? '已做对' : '已尝试'}
                    </span>
                  )}
                </div>
                <h2>{q.title}</h2>
                <p>{q.stem}</p>
                <div className="question-card-bottom">
                  <span>
                    {q.hasVisual ? (
                      <>
                        <Icon name="Shapes" size={15} />
                        可视化讲解
                      </>
                    ) : (
                      <>
                        <Icon name="ListChecks" size={15} />
                        思路与解析
                      </>
                    )}
                  </span>
                  <span>
                    开始练习
                    <Icon name="ArrowRight" size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {remote.data?.total === 0 && (
            <div className="empty-state">
              <Icon name="Search" size={32} />
              <h2>这个组合暂时没有题目</h2>
              <p>试着放宽难度或题型筛选。</p>
              <button
                className="button secondary"
                onClick={() => {
                  setParams({});
                  setSearch('');
                }}
              >
                重置筛选
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
