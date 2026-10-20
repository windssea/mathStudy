import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { PracticePaper, PracticeTopic, QuestionPublic } from '@mathstudy/contracts';
import { useRemote } from '../lib/api';
import { Loading, ErrorState } from '../components/ui';
import QuestionRunner from '../components/QuestionRunner';

type Result = { status: 'correct' | 'incorrect' | 'revealed' | 'skipped'; assisted: boolean };
export default function Practice() {
  const { kind, id } = useParams();
  const remote = useRemote<{ set: PracticeTopic | PracticePaper; items: QuestionPublic[] }>(
    `/practice/${kind}/${id}`,
  );
  if (remote.loading) return <Loading />;
  if (remote.error || !remote.data)
    return <ErrorState message={remote.error ?? '未找到练习'} retry={remote.retry} />;
  return <PracticeContent key={`${kind}-${id}`} {...remote.data} />;
}
function PracticeContent({
  set,
  items,
}: {
  set: PracticeTopic | PracticePaper;
  items: QuestionPublic[];
}) {
  const [params, setParams] = useSearchParams();
  const [index, setIndex] = useState(0),
    [round, setRound] = useState(0);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [ids, setIds] = useState(items.map((q) => q.id));
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(false);
  const paper = 'pages' in set ? set : undefined;
  const original = !!paper && params.get('original') === '1';
  const question = items.find((q) => q.id === ids[index]);
  const done = index >= ids.length;
  const independent = ids.filter(
    (id) => results[id]?.status === 'correct' && !results[id]?.assisted,
  ).length;
  const review = ids.filter((id) => results[id]?.status !== 'correct' || results[id]?.assisted);
  const back = paper ? '/?view=papers' : `/?unit=${'unitId' in set ? set.unitId : 'U01'}`;
  const source = question?.sources?.find((s) => s.paperId === paper?.id);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [index, original]);
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
        <h1>
          {paper ? `试卷${paper.id.slice(1)} · ` : ''}
          {set.title}
        </h1>
        {paper && (
          <button
            className="button secondary"
            onClick={() => setParams(original ? {} : { original: '1' })}
          >
            {original ? '回到练习' : '原卷'}
          </button>
        )}
      </div>
      {original && paper && (
        <section className="original-paper panel">
          <div className="original-controls">
            <button
              className="button secondary"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              上一张
            </button>
            <span>
              {page + 1} / {paper.pages.length}
            </span>
            <button
              className="button secondary"
              disabled={page === paper.pages.length - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              下一张
            </button>
            <button className="button subtle" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
              {zoom ? '适合宽度' : '放大'}
            </button>
          </div>
          <div
            className="paper-image"
            data-zoom={zoom}
            tabIndex={zoom ? 0 : undefined}
            aria-label={zoom ? '放大的原卷，可滚动查看' : undefined}
          >
            <img
              src={paper.pages[page].image}
              alt={`试卷${paper.id.slice(1)}，原卷第${page + 1}张`}
              width="1264"
              height="1848"
            />
          </div>
        </section>
      )}
      <div hidden={original}>
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
              <span>
                第 {index + 1} / {ids.length} 题
              </span>
              {source && (
                <button
                  onClick={() => {
                    setPage(source.page - 1);
                    setParams({ original: '1' });
                  }}
                >
                  原卷第{source.page}张 · {source.number}
                </button>
              )}
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
