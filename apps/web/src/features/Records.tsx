import { Button } from '../components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { useProgress, useAccount, progressMessage, synchronize } from '../lib/progress';
import type { QuestionPublic, PracticeCatalog } from '@mathstudy/contracts';
import { independentlyMastered } from '../lib/answer-status';
import { Icon, Loading, ErrorState } from '../components/ui';

export default function Records() {
  const { textbook: book } = useCourse(),
    progress = useProgress();
  const attempted = Object.entries(progress.answers);
  const account = useAccount();
  const [params, setParams] = useSearchParams();
  const reviewFilter =
    params.get('review') === 'resolved'
      ? 'resolved'
      : params.get('review') === 'all'
        ? 'all'
        : 'pending';
  const parsePage = (key: string) => Math.max(0, Math.trunc(Number(params.get(key))) || 0);
  const reviewPage = parsePage('reviewPage');
  const historyPage = parsePage('historyPage');
  function setPage(key: string, value: number) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set(key, String(value));
      return next;
    });
  }
  const detailQuery = new URLSearchParams({
    returnTo: `/records${params.size ? `?${params}` : ''}`,
  });
  const independent = attempted.filter(([, a]) => independentlyMastered(a)).length;
  const notebook = attempted.filter(([, a]) => a.everWrong || a.needsReview);
  const review = notebook
    .filter(
      ([, a]) =>
        reviewFilter === 'all' || (reviewFilter === 'pending' ? a.needsReview : !a.needsReview),
    )
    .sort((a, b) => b[1].date.localeCompare(a[1].date));
  const reviewIndex = Math.min(reviewPage, Math.max(0, Math.ceil(review.length / 20) - 1));
  const historyIndex = Math.min(
    historyPage,
    Math.max(0, Math.ceil(progress.history.length / 10) - 1),
  );
  const shownReview = review.slice(reviewIndex * 20, (reviewIndex + 1) * 20);
  const shownHistory = progress.history.slice(historyIndex * 10, (historyIndex + 1) * 10);
  const neededIds = [
    ...new Set([...shownReview.map(([id]) => id), ...shownHistory.map((a) => a.questionId)]),
  ].sort();
  const remote = useRemote<{ items: QuestionPublic[] }>(
    `/questions?scope=history&ids=${encodeURIComponent(neededIds.join(','))}`,
  );
  const catalog = useRemote<PracticeCatalog>('/practice');
  const questionMap = new Map(remote.data?.items.map((q) => [q.id, q]));
  const reviewGroups =
    catalog.data?.topics
      .map((topic) => ({
        topic,
        count: topic.questionIds.filter((id) => progress.answers[id]?.needsReview).length,
      }))
      .filter((group) => group.count > 0)
      .sort((a, b) => b.count - a.count) ?? [];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>练习记录</h1>
        </div>
      </div>
      <div className="records-sync-bar">
        <Link className="text-link" to={`/account?${detailQuery}`}>
          {account.user ? `${account.user.name} · 账号与同步` : '登录，跨设备同步记录'}
          <Icon name="ArrowRight" size={16} />
        </Link>
        {account.user && (
          <Button
            variant="outline"
            className="button secondary small-button"
            disabled={account.syncing}
            onClick={() => void synchronize().catch(() => {})}
          >
            立即同步{account.pending > 0 && `（${account.pending} 条待同步）`}
          </Button>
        )}
      </div>
      <section className="record-summary panel">
        <div className="record-stat">
          <b>{attempted.filter(([, a]) => a.needsReview).length}</b>
          <span>待复习</span>
        </div>
        <div className="record-stat">
          <b>{attempted.length}</b>
          <span>尝试过的题</span>
        </div>
        <div className="record-stat">
          <b>{independent}</b>
          <span>独立做对</span>
        </div>
      </section>
      <div className="records-columns">
        <section className="panel records-panel">
          <h2>
            <Icon name="RotateCcw" />
            错题与复习
          </h2>
          {reviewFilter === 'pending' && reviewGroups.length > 0 && (
            <div className="review-topic-list" aria-label="按题型复习">
              {reviewGroups.slice(0, 4).map(({ topic, count }) => (
                <Link
                  className="review-topic-row"
                  to={`/practice/topics/${topic.id}?review=1&fresh=1&${detailQuery}`}
                  key={topic.id}
                >
                  <span>
                    <strong>{topic.title}</strong>
                    <small>{count} 题待复习</small>
                  </span>
                  <span>
                    复习这组
                    <Icon name="ArrowRight" size={17} />
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="notebook-filters" role="group" aria-label="错题状态">
            {(
              [
                ['pending', '待复习'],
                ['resolved', '已掌握'],
                ['all', '全部'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                aria-pressed={reviewFilter === value}
                onClick={() => {
                  setParams((previous) => {
                    const next = new URLSearchParams(previous);
                    next.set('review', value);
                    next.delete('reviewPage');
                    return next;
                  });
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {remote.loading ? (
            <Loading />
          ) : remote.error ? (
            <ErrorState message={remote.error} retry={remote.retry} />
          ) : review.length ? (
            shownReview.map(([id, a]) => {
              const q = questionMap.get(id);
              return q ? (
                <Link className="record-row" key={id} to={`/questions/${id}?${detailQuery}`}>
                  <Icon name="Lightbulb" />
                  <span>
                    {q.title}
                    <small>
                      {!a.needsReview
                        ? '已独立答对'
                        : a.revealed
                          ? '看过提示或讲解，再独立试试'
                          : '待订正'}
                      {a.wrongCount > 0 && ` · 错过 ${a.wrongCount} 次`}
                    </small>
                  </span>
                  <Icon name="ChevronRight" size={16} />
                </Link>
              ) : null;
            })
          ) : (
            <div className="empty-state compact">
              <Icon name="Lightbulb" size={32} />
              <h3>{reviewFilter === 'resolved' ? '暂无已掌握错题' : '暂无待复习题目'}</h3>
              <p>做错或看过提示的题进入待复习；重新独立答对后转入已掌握。</p>
              <Link to="/questions" className="text-link">
                去题库练一练
                <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
          )}
          {review.length > 20 && (
            <nav className="history-pagination" aria-label="复习列表分页">
              <Button
                variant="outline"
                disabled={reviewIndex === 0}
                onClick={() => setPage('reviewPage', reviewIndex - 1)}
              >
                上一组
              </Button>
              <span>
                {reviewIndex + 1} / {Math.ceil(review.length / 20)}
              </span>
              <Button
                variant="outline"
                disabled={(reviewIndex + 1) * 20 >= review.length}
                onClick={() => setPage('reviewPage', reviewIndex + 1)}
              >
                下一组
              </Button>
            </nav>
          )}
        </section>
        <details className="panel records-panel lesson-records">
          <summary>
            <Icon name="BookOpen" />
            已完成的课节
          </summary>
          {progress.completed.length ? (
            book.catalog
              .flatMap((n) => n.lessons)
              .filter((l) => progress.completed.includes(l.id))
              .map((l) => (
                <Link className="record-row" key={l.id} to={`/books/${book.id}/lessons/${l.id}`}>
                  <Icon name="CheckCircle2" />
                  <span>{l.title}</span>
                  <Icon name="ChevronRight" size={16} />
                </Link>
              ))
          ) : (
            <div className="empty-state compact">
              <Icon name="Flag" size={32} />
              <h3>暂无已完成课节</h3>
              <p>完成课节后将在这里显示。</p>
              <Link className="button primary" to={`/books/${book.id}/lessons/U01-L01`}>
                开始学习
                <Icon name="ArrowRight" size={17} />
              </Link>
            </div>
          )}
        </details>
      </div>
      <section className="panel records-panel answer-history">
        <h2>
          <Icon name="ListChecks" />
          最近答题记录
        </h2>
        {progress.history.length ? (
          <ol>
            {shownHistory.map((a) => {
              const q = questionMap.get(a.questionId);
              return (
                <li key={a.id}>
                  <Link to={`/questions/${a.questionId}?${detailQuery}`}>
                    <div>
                      <strong>{q?.title ?? a.questionId}</strong>
                      <span className={`chip ${a.correct ? 'blue' : 'neutral'}`}>
                        {a.correct ? (a.assisted ? '借助方法答对' : '独立答对') : '待订正'}
                      </span>
                    </div>
                    <p>
                      {a.source === 'imported'
                        ? '旧版记录，未保存原始答案'
                        : q?.options
                          ? (q.options[Number(a.answers.value)] ?? a.answers.value)
                          : q?.construction
                            ? `方格作图：选中${[...(a.answers.cells ?? '')].filter((c) => c === '1').length}格`
                            : (q?.fields
                                .map(
                                  (f) =>
                                    `${f.label}：${a.answers[f.key] ?? '未填'}${f.suffix ?? ''}`,
                                )
                                .join('，') ?? Object.values(a.answers).join('，'))}
                    </p>
                    <small>
                      {new Date(a.date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                    </small>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="empty-state compact">
            <h3>还没有作答记录</h3>
            <p>提交答案后显示记录。</p>
          </div>
        )}
        {progress.history.length > 10 && (
          <nav className="history-pagination" aria-label="答题历史分页">
            <Button
              variant="outline"
              disabled={historyIndex === 0}
              onClick={() => setPage('historyPage', historyIndex - 1)}
            >
              上一组
            </Button>
            <span>
              {historyIndex + 1} / {Math.ceil(progress.history.length / 10)}
            </span>
            <Button
              variant="outline"
              disabled={(historyIndex + 1) * 10 >= progress.history.length}
              onClick={() => setPage('historyPage', historyIndex + 1)}
            >
              下一组
            </Button>
          </nav>
        )}
        <details className="account-note">
          <summary>记录与同步说明</summary>
          <p>{progressMessage()}。保留最近 100 次作答，历史导入条目可能没有原始答案。</p>
        </details>
      </section>
    </>
  );
}
