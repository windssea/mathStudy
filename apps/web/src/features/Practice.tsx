import { Button } from '../components/ui/button';
import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import type { PracticeTopic, QuestionPublic } from '@mathstudy/contracts';
import { useRemote } from '../lib/api';
import { Loading, ErrorState } from '../components/ui';
import QuestionDeck from '../components/QuestionDeck';
import { Icon } from '../components/ui';

type Result = { status: 'correct' | 'incorrect' | 'revealed' | 'skipped'; assisted: boolean };
export default function Practice() {
  const { kind, id } = useParams();
  const [params] = useSearchParams();
  const selection = new URLSearchParams();
  for (const key of ['difficulty', 'type'])
    if (params.get(key)) selection.set(key, params.get(key)!);
  const remote = useRemote<{
    set: PracticeTopic;
    items: QuestionPublic[];
    topics: PracticeTopic[];
  }>(kind === 'topics' ? `/practice/topics/${id}?${selection}` : '/practice');
  if (kind !== 'topics') return <Navigate to="/" replace />;
  if (remote.loading) return <Loading />;
  if (remote.error || !remote.data)
    return <ErrorState message={remote.error ?? '未找到练习'} retry={remote.retry} />;
  return <PracticeContent key={`${kind}-${id}-${selection}`} {...remote.data} />;
}
function PracticeContent({
  set,
  items,
  topics = [],
}: {
  set: PracticeTopic;
  items: QuestionPublic[];
  topics?: PracticeTopic[];
}) {
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
    <div className="practice-session">
      <div className="practice-session-head">
        <Link className="text-link" to={back}>
          <Icon name="ArrowLeft" size={17} /> 返回
        </Link>
        <h1>{set.title}</h1>
      </div>
      <div className="practice-session-body">
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
                      {!results[id] || results[id]?.status === 'skipped'
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
                <Button variant="default" className="button primary" onClick={() => retry(review)}>
                  重练这些题
                </Button>
              )}
              <Button
                variant="outline"
                className="button secondary"
                onClick={() => retry(items.map((q) => q.id))}
              >
                再练一遍
              </Button>
              <Link className="button secondary" to={back}>
                返回
              </Link>
            </div>
            {set.guide && (
              <div className="result-method-check">
                <h3>再练前先检查</h3>
                <p>{set.guide.selfCheck}</p>
                <Link
                  className="text-link"
                  to={`/?unit=${set.unitId}&view=methods&method=${set.id}`}
                >
                  回看本题型方法
                  <Icon name="ArrowRight" size={16} />
                </Link>
              </div>
            )}
          </section>
        ) : question ? (
          <>
            <div className="practice-progress session-toolbar">
              <select
                aria-label="跳转题目"
                value={index}
                onChange={(e) => setIndex(Number(e.target.value))}
              >
                {ids.map((id, i) => (
                  <option key={id} value={i}>
                    第{i + 1}题 · {items.find((q) => q.id === id)?.title}
                    {results[id]
                      ? results[id].status === 'correct'
                        ? ' (已答对)'
                        : results[id].status === 'skipped'
                          ? ' (已跳过)'
                          : ' (待复习)'
                      : ''}
                  </option>
                ))}
              </select>
              <span aria-live="polite">
                第 {index + 1} / {ids.length} 题
              </span>
              <span className="session-completed">已作答 {Object.keys(results).length} 题</span>
            </div>
            <QuestionDeck
              key={round}
              items={ids.map((id) => items.find((q) => q.id === id)!)}
              topics={topics}
              index={index}
              onResult={(id, status, assisted) =>
                setResults((r) => ({ ...r, [id]: { status, assisted } }))
              }
            />
            <footer className="practice-next session-footer">
              <Button
                variant="outline"
                className="button secondary"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
              >
                <Icon name="ArrowLeft" size={17} /> 上一题
              </Button>
              <span className="session-footer-note">
                {results[question.id] ? '已记录，可以继续' : '先作答，也可以暂时跳过'}
              </span>
              {!results[question.id] && (
                <Button
                  variant="ghost"
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
                </Button>
              )}
              <Button
                variant="default"
                className="button primary"
                disabled={!results[question.id]}
                onClick={() => setIndex((i) => i + 1)}
              >
                {index === ids.length - 1 ? '查看结果' : '下一题'}
                <Icon name="ArrowRight" size={17} />
              </Button>
            </footer>
          </>
        ) : (
          <p>暂无题目。</p>
        )}
      </div>
    </div>
  );
}
