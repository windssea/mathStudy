import { Button } from '../components/ui/button';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import type { PracticeTopic, QuestionPublic } from '@mathstudy/contracts';
import { useRemote } from '../lib/api';
import { Loading, ErrorState, Icon } from '../components/ui';
import QuestionDeck from '../components/QuestionDeck';
import { currentLearningOwner, useAccount, useProgress } from '../lib/progress';
import { safeReturnTo } from '../lib/navigation';
import {
  practiceDraftSchema,
  readDraft,
  writeDraft,
  type PracticeDraft,
} from '../lib/practice-drafts';

const roundSize = 8;
function requestedBatch(params: URLSearchParams, pool: string[]) {
  if (params.get('all') === '1') return pool;
  const batch = [...new Set((params.get('batch') ?? '').split(','))]
    .filter((id) => pool.includes(id))
    .slice(0, roundSize);
  return batch.length ? batch : undefined;
}
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
  return (
    <PracticeContent
      key={`${kind}-${id}-${selection}-${params.get('review') ?? ''}`}
      {...remote.data}
    />
  );
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
  const [params, setParams] = useSearchParams();
  const progress = useProgress();
  useAccount();
  const [owner] = useState(currentLearningOwner);
  const draftId = `practice:${set.id}:${params.get('difficulty') ?? ''}:${params.get('type') ?? ''}:${params.get('review') ?? ''}`;
  const [saved] = useState(() => {
    if (params.get('fresh') === '1') return;
    const draft = readDraft(owner, draftId, practiceDraftSchema);
    if (
      params.get('review') === '1' &&
      !params.has('question') &&
      !params.has('result') &&
      draft &&
      draft.index >= draft.ids.length &&
      draft.poolIds.every((id) => !progress.answers[id]?.needsReview)
    )
      return;
    return draft;
  });
  // Fix the review queue at entry: correcting a question must not remove it mid-round.
  const [available] = useState(() => {
    if (params.get('review') !== '1') return items;
    if (saved?.poolIds.length)
      return saved.poolIds
        .map((id) => items.find((q) => q.id === id))
        .filter((q): q is QuestionPublic => !!q);
    return items.filter((q) => progress.answers[q.id]?.needsReview);
  });
  const questionIds = available.map((q) => q.id);
  const [session, setSession] = useState<PracticeDraft>(() => {
    const valid = saved?.ids.length && saved.ids.every((id) => questionIds.includes(id));
    const mode =
      params.get('all') === '1'
        ? 'all'
        : params.has('batch')
          ? 'short'
          : valid
            ? saved.mode
            : 'short';
    const ids =
      requestedBatch(params, questionIds) ??
      (valid ? saved.ids : questionIds.slice(0, mode === 'all' ? undefined : roundSize));
    const queryId = params.get('question');
    const requested = queryId ? questionIds.indexOf(queryId) : -1;
    const initialIds =
      requested >= 0 && !ids.includes(queryId!)
        ? mode === 'all'
          ? questionIds
          : questionIds.slice(
              Math.floor(requested / roundSize) * roundSize,
              Math.floor(requested / roundSize) * roundSize + roundSize,
            )
        : ids;
    const index =
      queryId && initialIds.includes(queryId)
        ? initialIds.indexOf(queryId)
        : params.get('result') === '1' && valid
          ? initialIds.length
          : valid
            ? Math.min(saved.index, initialIds.length)
            : 0;
    return {
      poolIds: questionIds,
      ids: initialIds,
      index,
      mode,
      round: valid ? saved.round : Date.now(),
      completed: valid ? saved.completed.filter((id) => questionIds.includes(id)) : [],
      results: valid
        ? Object.fromEntries(
            Object.entries(saved.results).filter(([id]) => questionIds.includes(id)),
          )
        : {},
    };
  });
  const { ids, index, round, results, mode } = session;
  const done = index >= ids.length;
  const question = available.find((q) => q.id === ids[index]);
  const independent = ids.filter(
    (id) => results[id]?.status === 'correct' && !results[id]?.assisted,
  ).length;
  const review = ids.filter((id) => results[id]?.status !== 'correct' || results[id]?.assisted);
  const covered = new Set([...session.completed, ...(done ? ids.filter((id) => results[id]) : [])]);
  const remaining = questionIds.filter((id) => !covered.has(id));
  const backParams = new URLSearchParams({ unit: set.unitId });
  for (const key of ['difficulty', 'type'])
    if (params.get(key)) backParams.set(key, params.get(key)!);
  const back = safeReturnTo(params.get('returnTo'), `/?${backParams}`);
  const backLabel = back.startsWith('/records') ? '返回记录' : '返回题型';
  function navigate(next: PracticeDraft, replace = false) {
    setSession(next);
    const query = new URLSearchParams(params);
    if (next.index < next.ids.length) {
      query.set('question', next.ids[next.index]);
      query.delete('result');
    } else {
      query.delete('question');
      query.set('result', '1');
    }
    if (next.mode === 'all') query.set('all', '1');
    else query.delete('all');
    if (next.mode === 'all') query.delete('batch');
    else query.set('batch', next.ids.join(','));
    query.delete('fresh');
    setParams(query, { replace });
  }
  useEffect(() => {
    if (owner === currentLearningOwner()) writeDraft(owner, draftId, session);
  }, [owner, draftId, session]);
  // Restore a stored position into the address bar once. Later browser Back follows the URL.
  useEffect(() => {
    if (!params.has('question') && !params.has('result') && ids.length) navigate(session, true);
    // This is initial restoration, not URL synchronization after every grade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const queryId = params.get('question');
  const allQuestions = params.get('all') === '1';
  const resultPage = params.get('result') === '1';
  const queryBatch = params.get('batch');
  useEffect(() => {
    setSession((current) => {
      const fromUrl = requestedBatch(params, questionIds);
      if (resultPage && fromUrl) {
        const nextMode = allQuestions ? 'all' : current.mode === 'review' ? 'review' : 'short';
        return current.index === fromUrl.length &&
          current.mode === nextMode &&
          current.ids.join(',') === fromUrl.join(',')
          ? current
          : { ...current, ids: fromUrl, index: fromUrl.length, mode: nextMode };
      }
      if (queryId && questionIds.includes(queryId)) {
        if (fromUrl?.includes(queryId) && fromUrl.join(',') !== current.ids.join(',')) {
          return {
            ...current,
            ids: fromUrl,
            mode: allQuestions ? 'all' : 'short',
            index: fromUrl.indexOf(queryId),
          };
        }
        if (allQuestions !== (current.mode === 'all')) {
          const position = questionIds.indexOf(queryId);
          const nextIds = allQuestions
            ? questionIds
            : questionIds.slice(
                Math.floor(position / roundSize) * roundSize,
                Math.floor(position / roundSize) * roundSize + roundSize,
              );
          return {
            ...current,
            ids: nextIds,
            mode: allQuestions ? 'all' : 'short',
            index: nextIds.indexOf(queryId),
          };
        }
        const found = current.ids.indexOf(queryId);
        if (found >= 0) return found === current.index ? current : { ...current, index: found };
        const position = questionIds.indexOf(queryId);
        const nextIds =
          current.mode === 'all'
            ? questionIds
            : questionIds.slice(
                Math.floor(position / roundSize) * roundSize,
                Math.floor(position / roundSize) * roundSize + roundSize,
              );
        return { ...current, ids: nextIds, index: nextIds.indexOf(queryId) };
      }
      return resultPage && current.index !== current.ids.length
        ? { ...current, index: current.ids.length }
        : current;
    });
    // Available questions are fixed for this mounted selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId, resultPage, allQuestions, queryBatch]);
  if (!available.length)
    return (
      <section className="practice-result panel">
        <h1>{set.title}</h1>
        <p>{params.get('review') === '1' ? '这一组暂时没有待复习题。' : '没有符合条件的题目。'}</p>
        <Link className="button secondary" to={back}>
          {backLabel}
        </Link>
      </section>
    );
  function retry(nextIds: string[]) {
    const nextResults = { ...results };
    for (const id of nextIds) delete nextResults[id];
    navigate({
      ...session,
      ids: nextIds.slice(0, roundSize),
      index: 0,
      round: round + 1,
      mode: 'review',
      completed: [...covered].filter((id) => !nextIds.includes(id)),
      results: nextResults,
    });
  }
  function advance(skipped = false) {
    navigate({
      ...session,
      index: index + 1,
      results:
        skipped && question
          ? { ...results, [question.id]: { status: 'skipped', assisted: false } }
          : results,
    });
  }
  return (
    <div className="practice-session">
      <div className="practice-session-head">
        <Link className="text-link" to={back}>
          <Icon name="ArrowLeft" size={17} /> 返回
        </Link>
        <h1>
          {set.title}
          {params.get('review') === '1' ? ' · 复习' : ''}
        </h1>
      </div>
      <div className="practice-session-body">
        {done ? (
          <section className="practice-result panel">
            <h2>本轮完成</h2>
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
            <p>
              已练 {covered.size} / {available.length} 题
            </p>
            {review.length > 0 && (
              <div className="review-list">
                {review.map((id) => (
                  <Link key={id} to={`/questions/${id}`}>
                    {available.find((q) => q.id === id)?.title}
                    <span>
                      {!results[id] || results[id]?.status === 'skipped'
                        ? '未作答'
                        : results[id]?.status === 'incorrect'
                          ? '答错'
                          : '借助方法作答'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className="practice-result-actions">
              {remaining.length > 0 && (
                <Button
                  onClick={() =>
                    navigate({
                      ...session,
                      ids: remaining.slice(0, roundSize),
                      index: 0,
                      completed: [...covered],
                      mode: 'short',
                    })
                  }
                >
                  继续练 {Math.min(roundSize, remaining.length)} 题{' '}
                  <Icon name="ArrowRight" size={17} />
                </Button>
              )}
              {review.length > 0 && (
                <Button
                  variant={remaining.length ? 'outline' : 'default'}
                  onClick={() => retry(review)}
                >
                  重练这些题
                </Button>
              )}
              {review.length !== ids.length && (
                <Button variant="outline" onClick={() => retry(ids)}>
                  重练本轮
                </Button>
              )}
              <Link className="button secondary" to={back}>
                {backLabel}
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
                  回看本题型方法 <Icon name="ArrowRight" size={16} />
                </Link>
              </div>
            )}
          </section>
        ) : question ? (
          <>
            <div className="practice-progress session-toolbar">
              <select
                aria-label="跳转题目"
                value={questionIds.indexOf(question.id)}
                onChange={(e) => {
                  const position = Number(e.target.value);
                  const target = questionIds[position];
                  if (!target) return;
                  const local = ids.indexOf(target);
                  const nextIds =
                    local >= 0
                      ? ids
                      : mode === 'all'
                        ? questionIds
                        : questionIds.slice(
                            Math.floor(position / roundSize) * roundSize,
                            Math.floor(position / roundSize) * roundSize + roundSize,
                          );
                  navigate({ ...session, ids: nextIds, index: nextIds.indexOf(target) });
                }}
              >
                {questionIds.map((id, i) => (
                  <option key={id} value={i}>
                    第{i + 1}题 · {available[i].title}
                    {results[id]
                      ? results[id].status === 'correct' && !results[id].assisted
                        ? ' (独立答对)'
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
              <span className="session-completed">
                已答{' '}
                {
                  Object.values(results).filter(
                    (r) => r.status !== 'skipped' && r.status !== 'revealed',
                  ).length
                }{' '}
                / {available.length}
              </span>
              {mode !== 'all' && available.length > roundSize && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    navigate({
                      ...session,
                      ids: questionIds,
                      index: questionIds.indexOf(question.id),
                      mode: 'all',
                    })
                  }
                >
                  练全部
                </Button>
              )}
            </div>
            <QuestionDeck
              key={`${round}:${ids.join(',')}`}
              items={ids.map((id) => available.find((q) => q.id === id)!)}
              topics={topics}
              index={index}
              draftScope={`${draftId}:round:${round}`}
              onResult={(id, status, assisted) =>
                setSession((s) => ({ ...s, results: { ...s.results, [id]: { status, assisted } } }))
              }
            />
            <footer className="practice-next session-footer">
              <Button
                variant="outline"
                className="button secondary"
                disabled={index === 0}
                onClick={() => navigate({ ...session, index: index - 1 })}
              >
                <Icon name="ArrowLeft" size={17} /> 上一题
              </Button>
              <span className="session-footer-note">
                {results[question.id] ? '已记录，可以继续' : '先作答，也可以暂时跳过'}
              </span>
              {!results[question.id] && (
                <Button variant="ghost" className="button subtle" onClick={() => advance(true)}>
                  跳过
                </Button>
              )}
              <Button
                className="button primary"
                disabled={!results[question.id]}
                onClick={() => advance()}
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
