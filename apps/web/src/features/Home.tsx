import { Link, useSearchParams } from 'react-router-dom';
import type { PracticeCatalog } from '@mathstudy/contracts';
import { useCourse } from '../app/course';
import { useRemote } from '../lib/api';
import { useProgress } from '../lib/progress';
import { Loading, ErrorState } from '../components/ui';

export default function Home() {
  const { textbook: book } = useCourse();
  const remote = useRemote<PracticeCatalog>('/practice');
  const [params, setParams] = useSearchParams();
  const papers = params.get('view') === 'papers';
  const unit = params.get('unit') ?? (papers ? '' : 'U01');
  const progress = useProgress();
  function selectUnit(value: string) {
    setParams({ ...(papers ? { view: 'papers' } : {}), unit: value });
  }
  if (remote.loading) return <Loading />;
  if (remote.error || !remote.data)
    return <ErrorState message={remote.error ?? '加载失败'} retry={remote.retry} />;
  const topics = remote.data.topics.filter(
    (t) => (!unit || t.unitId === unit) && t.questionIds.length,
  );
  const sets = remote.data.papers.filter((p) => !unit || p.unitIds.includes(unit));
  return (
    <>
      <div className="practice-page-head">
        <h1>数学练习</h1>
        <span>苏教版 · 四年级上册</span>
      </div>
      <div className="practice-toolbar">
        <div className="practice-modes" role="group" aria-label="练习方式">
          <button aria-pressed={!papers} onClick={() => setParams({ unit: 'U01' })}>
            专题练习
          </button>
          <button aria-pressed={papers} onClick={() => setParams({ view: 'papers' })}>
            试卷练习
          </button>
        </div>
        <label className="practice-unit">
          单元
          <select value={unit} onChange={(e) => selectUnit(e.target.value)}>
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
      </div>
      {papers ? (
        <div className="paper-list">
          {sets.map((p) => (
            <section className="practice-entry panel" key={p.id}>
              <span className="paper-number">{p.id.slice(1)}</span>
              <div>
                <h2>{p.title}</h2>
                <span>
                  {p.pages.length}张原卷 · {p.questionIds.length}题
                </span>
              </div>
              <Link className="button secondary" to={`/practice/papers/${p.id}?original=1`}>
                原卷
              </Link>
              <Link className="button primary" to={`/practice/papers/${p.id}`}>
                练习
              </Link>
            </section>
          ))}
        </div>
      ) : (
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
              <Link className="button primary" to={`/practice/topics/${t.id}`}>
                练习
              </Link>
            </section>
          ))}
        </div>
      )}
      {papers && sets.length === 0 && <p className="practice-empty">该单元暂无收集试卷。</p>}
      <div className="practice-bottom">
        <Link to="/records">错题与记录</Link>
        <Link to="/questions">全部题目</Link>
        <Link to={`/books/${book.id}`}>知识讲解</Link>
      </div>
    </>
  );
}
