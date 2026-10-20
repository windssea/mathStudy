import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { useProgress, useAccount, progressMessage, synchronize } from '../lib/progress';
import type { QuestionPublic } from '@mathstudy/contracts';
import { Icon, Loading, ErrorState } from '../components/ui';

export default function Records() {
  const { textbook: book } = useCourse(),
    progress = useProgress();
  const remote = useRemote<{ items: QuestionPublic[] }>('/questions');
  const attempted = Object.entries(progress.answers);
  const account = useAccount();
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const independent = attempted.filter(([, a]) => a.independentCorrect).length;
  const notebook = attempted.filter(([, a]) => a.everWrong || a.needsReview);
  const review = notebook.filter(
    ([, a]) =>
      reviewFilter === 'all' || (reviewFilter === 'pending' ? a.needsReview : !a.needsReview),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>练习记录</h1>
          <p>{progressMessage()}</p>
        </div>
      </div>
      <div className="records-sync-bar">
        <Link className="text-link" to="/account">
          {account.user ? `${account.user.name} · 账号与同步` : '登录，跨设备同步记录'}
          <Icon name="ArrowRight" size={16} />
        </Link>
        {account.user && (
          <button
            className="button secondary small-button"
            disabled={account.syncing}
            onClick={() => void synchronize().catch(() => {})}
          >
            立即同步{account.pending > 0 && `（${account.pending} 条待同步）`}
          </button>
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
                onClick={() => setReviewFilter(value)}
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
            review.map(([id, a]) => {
              const q = remote.data?.items.find((item) => item.id === id);
              return q ? (
                <Link className="record-row" key={id} to={`/questions/${id}`}>
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
        <p className="account-note">
          显示最近 100 条作答；“本机导入”表示旧版没有保留原始答案的历史结论。
        </p>
        {progress.history.length ? (
          <ol>
            {progress.history.map((a) => {
              const q = remote.data?.items.find((q) => q.id === a.questionId);
              return (
                <li key={a.id}>
                  <Link to={`/questions/${a.questionId}`}>
                    <div>
                      <strong>{q?.title ?? a.questionId}</strong>
                      <span className={`chip ${a.correct ? 'blue' : 'neutral'}`}>
                        {a.correct ? '答对' : '待订正'}
                        {a.assisted ? ' · 用过提示' : ''}
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
                                  (f) => `${f.label}：${a.answers[f.key] ?? '—'}${f.suffix ?? ''}`,
                                )
                                .join('，') ?? Object.values(a.answers).join('，'))}
                    </p>
                    <small>
                      {new Date(a.date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} ·{' '}
                      {a.source === 'verified'
                        ? '服务端已判分'
                        : a.source === 'imported'
                          ? '本机导入'
                          : '本机记录'}
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
      </section>
    </>
  );
}
