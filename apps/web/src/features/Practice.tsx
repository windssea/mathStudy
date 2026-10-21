import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import type { PracticeTopic, QuestionPublic } from '@mathstudy/contracts';
import { useRemote } from '../lib/api';
import { Loading, ErrorState } from '../components/ui';
import QuestionRunner from '../components/QuestionRunner';

type Result = { status: 'correct' | 'incorrect' | 'revealed' | 'skipped'; assisted: boolean };
export default function Practice() {
  const { kind, id } = useParams();
  const [params] = useSearchParams();
  const selection = new URLSearchParams();
  for (const key of ['difficulty', 'type'])
    if (params.get(key)) selection.set(key, params.get(key)!);
  const remote = useRemote<{ set: PracticeTopic; items: QuestionPublic[] }>(
    kind === 'topics' ? `/practice/topics/${id}?${selection}` : '/practice',
  );
  if (kind !== 'topics') return <Navigate to="/" replace />;
  if (remote.loading) return <Loading />;
  if (remote.error || !remote.data)
    return <ErrorState message={remote.error ?? '未找到练习'} retry={remote.retry} />;
  return <PracticeContent key={`${kind}-${id}-${selection}`} {...remote.data} />;
}
function PracticeContent({ set, items }: { set: PracticeTopic; items: QuestionPublic[] }) {
  const [params] = useSearchParams();
  const [index, setIndex] = useState(0),
    [round, setRound] = useState(0);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [ids, setIds] = useState(items.map((q) => q.id));
  const question = items.find((q) => q.id === ids[index]);
  const done = index >= ids.length;
  const independent = ids.filter(
    (id) => results[id]?.status === 'correct' && !results[id]?.assisted,
  ).length;
  const review = ids.filter((id) => results[id]?.status !== 'correct' || results[id]?.assisted);
  const back = `/?unit=${set.unitId}&${params}`;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [index]);
  if (!items.length)
    return (
      <section className="practice-result panel">
        <h1>{set.title}</h1>
        <p>没有符合条件的题目。</p>
        <Link className="button secondary" to={back}>
          调整筛选
        </Link>
      </section>
    );
  function retry(questions: string[]) {
    setIds(questions);
    setIndex(0);
    setResults({});
    setRound((n) => n + 1);
  }
  return (
    <>
      <div className="practice-session-head">
        <Link className="text-link" to={back}>
          返回
        </Link>
        <h1>{set.title}</h1>
      </div>
      <div>
        {done ? (
          <section className="practice-result panel">
            <h2>本次练习</h2>
            <div className="result-numbers">
              <div>
                <b>{ids.length}</b>
                <span>题目</span>
              </div>
              <div>
                <b>{independent}</b>
                <span>独立答对</span>
              </div>
              <div>
                <b>{ids.filter((id) => results[id]?.status === 'skipped').length}</b>
                <span>跳过</span>
              </div>
            </div>
            {review.length > 0 && (
              <div className="review-list">
                {review.map((id) => (
                  <Link key={id} to={`/questions/${id}`}>
                    {items.find((q) => q.id === id)?.title}
                    <span>
                      {results[id]?.status === 'skipped'
                        ? '未作答'
                        : results[id]?.status === 'incorrect'
                          ? '答错'
                          : '用过提示或解析'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className="practice-result-actions">
              {review.length > 0 && (
                <button className="button primary" onClick={() => retry(review)}>
                  重练这些题
                </button>
              )}
              <button className="button secondary" onClick={() => retry(items.map((q) => q.id))}>
                再练一遍
              </button>
              <Link className="button secondary" to={back}>
                返回
              </Link>
            </div>
          </section>
        ) : question ? (
          <>
            <div className="practice-progress">
              <select
                aria-label="跳转题目"
                value={index}
                onChange={(e) => setIndex(Number(e.target.value))}
              >
                {ids.map((id, i) => (
                  <option key={id} value={i}>
                    第{i + 1}题 · {items.find((q) => q.id === id)?.title}
                  </option>
                ))}
              </select>
              <span>
                第 {index + 1} / {ids.length} 题
              </span>
              <progress value={index} max={ids.length} aria-label="本次练习进度" />
            </div>
            <section className="practice-current panel">
              <QuestionRunner
                key={`${round}-${question.id}`}
                question={question}
                headingLevel={2}
                onResult={(status, assisted) =>
                  setResults((r) => ({ ...r, [question.id]: { status, assisted } }))
                }
              />
            </section>
            <div className="practice-next">
              {!results[question.id] && (
                <button
                  className="button subtle"
                  onClick={() => {
                    setResults((r) => ({
                      ...r,
                      [question.id]: { status: 'skipped', assisted: false },
                    }));
                    setIndex((i) => i + 1);
                  }}
                >
                  跳过
                </button>
              )}
              <button
                className="button primary"
                disabled={!results[question.id]}
                onClick={() => setIndex((i) => i + 1)}
              >
                {index === ids.length - 1 ? '查看结果' : '下一题'}
              </button>
            </div>
          </>
        ) : (
          <p>暂无题目。</p>
        )}
      </div>
    </>
  );
}
