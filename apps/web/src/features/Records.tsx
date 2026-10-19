import { Link } from 'react-router-dom';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { useProgress, isStorageAvailable } from '../lib/progress';
import type { QuestionPublic } from '@mathstudy/contracts';
import { Icon, Loading, ErrorState, ProgressRing } from '../components/ui';

export default function Records() {
  const { textbook: book, availableLessons } = useCourse(),
    progress = useProgress();
  const remote = useRemote<{ items: QuestionPublic[] }>('/questions');
  const attempted = Object.entries(progress.answers);
  const independent = attempted.filter(([, a]) => a.independentCorrect).length;
  const review = attempted.filter(([, a]) => !a.correct || a.revealed);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">不和别人比，只看自己的收获</div>
          <h1>我的学习记录</h1>
          <p>
            {isStorageAvailable()
              ? '这些记录保存在当前设备，换浏览器或清除数据后不会同步。'
              : '当前浏览器无法持久保存记录，页面关闭后记录可能丢失。'}
          </p>
        </div>
      </div>
      <section className="record-summary panel">
        <ProgressRing value={progress.completed.length} total={availableLessons} />
        <div>
          <span>全部已开放课节</span>
          <h2>一步一个脚印</h2>
          <p>完成探索与练习后，可以在课节末尾记录完成。</p>
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
            <Icon name="BookOpen" />
            已完成的课节
          </h2>
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
              <h3>第一课，在等你出发</h3>
              <p>看懂演示，再独立试几道题。</p>
              <Link className="button primary" to={`/books/${book.id}/lessons/U01-L01`}>
                开始学习
                <Icon name="ArrowRight" size={17} />
              </Link>
            </div>
          )}
        </section>
        <section className="panel records-panel">
          <h2>
            <Icon name="RotateCcw" />
            值得再想一想的题
          </h2>
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
                      {a.revealed ? '看过提示或讲解，再独立试试' : '上次没有做对，再想一想'}
                    </small>
                  </span>
                  <Icon name="ChevronRight" size={16} />
                </Link>
              ) : null;
            })
          ) : (
            <div className="empty-state compact">
              <Icon name="Lightbulb" size={32} />
              <h3>把每次尝试变成收获</h3>
              <p>做错的题和使用过提示的题，会留在这里方便复习。</p>
              <Link to="/questions" className="text-link">
                去题库练一练
                <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
