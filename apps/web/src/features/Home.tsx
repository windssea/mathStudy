import { Link, useSearchParams } from 'react-router-dom';
import { difficultyLabels, typeLabels, type PracticeCatalog } from '@mathstudy/contracts';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { useProgress } from '../lib/progress';
import { Loading, ErrorState } from '../components/ui';

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
  return (
    <>
      <div className="practice-page-head">
        <h1>数学题库</h1>
        <span>苏教版 · 四年级上册</span>
      </div>
      <div className="practice-toolbar">
        <label className="practice-unit">
          单元
          <select value={unit} onChange={(e) => filter('unit', e.target.value)}>
            <option value="">全部单元</option>
            {book.catalog
              .filter((n) => n.kind === 'unit')
              .map((n, i) => (
                <option value={n.id} key={n.id}>
                  第{['一', '二', '三', '四', '五', '六'][i]}单元 · {n.title}
                </option>
              ))}
          </select>
        </label>
        <label className="practice-unit">
          题型
          <select value={type} onChange={(e) => filter('type', e.target.value)}>
            <option value="">全部题型</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="practice-unit">
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
      </div>
      <div className="topic-list">
        {topics.map((t) => (
          <section className="practice-entry panel" key={t.id}>
            <div>
              <h2>{t.title}</h2>
              <span>
                已练 {t.questionIds.filter((id) => progress.answers[id]).length} /{' '}
                {t.questionIds.length}题
              </span>
            </div>
            <Link className="button primary" to={`/practice/topics/${t.id}?${selection}`}>
              练习
            </Link>
          </section>
        ))}
      </div>
      {topics.length === 0 && <p className="practice-empty">没有符合条件的题目，请调整筛选。</p>}
      <div className="practice-bottom">
        <Link to="/records">错题与记录</Link>
        <Link to="/questions">全部题目</Link>
        <Link to={`/books/${book.id}`}>知识讲解</Link>
      </div>
    </>
  );
}
