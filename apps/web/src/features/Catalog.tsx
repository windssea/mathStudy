import { Input } from '../components/ui/input';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useCourse } from '../app/course';
import { ErrorState, Icon } from '../components/ui';
import { useProgress } from '../lib/progress';

export default function Catalog() {
  const { textbook: book, availableLessons } = useCourse();
  const { editionId } = useParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [expanded, setExpanded] = useState(location.hash.slice(1) || 'U01');
  const progress = useProgress();
  useEffect(() => {
    if (location.hash) {
      setExpanded(location.hash.slice(1));
    }
  }, [location.hash]);
  if (editionId !== book.id) return <ErrorState message="未找到这本教材。" />;
  const nodes = book.catalog.filter(
    (n) =>
      (!onlyOpen || n.lessons.some((l) => l.available)) &&
      (!search || `${n.title}${n.lessons.map((l) => l.title).join('')}`.includes(search)),
  );
  const selected = nodes.find((n) => n.id === expanded) ?? nodes[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>课程目录</h1>
        </div>
      </div>
      <section className="catalog-book panel">
        <div>
          <h2>苏教版数学四年级上册</h2>
          <p>
            {book.editionLabel} · {book.publisher}
          </p>
        </div>
        <div className="catalog-book-status">
          <strong>
            {availableLessons} <small>/ {book.catalog.flatMap((n) => n.lessons).length}</small>
          </strong>
          <span>已开放 / 全部课节</span>
        </div>
      </section>
      <div className="filter-toolbar">
        <label className="search-box">
          <Icon name="Search" size={19} />
          <Input
            aria-label="搜索课程"
            placeholder="搜索单元或课节"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="checkbox-filter">
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
          />
          只看已开放
        </label>
        <span className="results-count">{nodes.length} 个目录项目</span>
      </div>
      <div className="catalog-workbench collection-layout">
        <aside className="collection-nav" aria-label="课程单元">
          <h2>单元目录</h2>
          {nodes.map((n) => (
            <button
              id={n.id}
              key={n.id}
              className={selected?.id === n.id ? 'selected' : ''}
              aria-pressed={selected?.id === n.id}
              onClick={() => setExpanded(n.id)}
            >
              <span
                className="unit-index"
                data-tone={n.kind === 'unit' ? (Number(n.id.slice(1)) - 1) % 4 : 0}
              >
                {n.kind === 'unit' ? Number(n.id.slice(1)) : <Icon name="Shapes" size={15} />}
              </span>
              <span>{n.title}</span>
              <Icon name="ChevronRight" size={15} />
            </button>
          ))}
        </aside>
        <section className="catalog-selected panel pane-scroll" aria-label="本单元课节">
          {!selected ? (
            <div className="empty-state">
              <Icon name="Search" size={30} />
              <h2>没有找到匹配的课程</h2>
              <p>换个关键词再试。</p>
            </div>
          ) : (
            <>
              <div className="catalog-selected-heading">
                <h2>{selected.title}</h2>
                <span>{selected.lessons.length} 个课节</span>
              </div>
              {selected.kind === 'unit' && !selected.lessons.some((l) => l.available) && (
                <div className="catalog-available-actions">
                  <p>课程演示正在准备，先学方法或做练习。</p>
                  <Link className="button secondary" to={`/?unit=${selected.id}&view=methods`}>
                    学本单元方法
                  </Link>
                  <Link className="button primary" to={`/?unit=${selected.id}`}>
                    选题型练习
                    <Icon name="ArrowRight" size={16} />
                  </Link>
                </div>
              )}
              <div className="catalog-lessons">
                {selected.lessons.map((l, index) =>
                  l.available ? (
                    <Link
                      to={`/books/${book.id}/lessons/${l.id}`}
                      className="lesson-row"
                      key={l.id}
                    >
                      <span className="lesson-number">
                        {progress.completed.includes(l.id) ? (
                          <Icon name="Check" size={17} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div>
                        <h3>{l.title}</h3>
                        <span>
                          课本 p.{l.pages.join('-')} · {l.minutes} 分钟
                        </span>
                      </div>
                      <span className="lesson-action">
                        去学习
                        <Icon name="ChevronRight" size={16} />
                      </span>
                    </Link>
                  ) : (
                    <div className="lesson-row planned-lesson" key={l.id}>
                      <span className="lesson-number">{index + 1}</span>
                      <div>
                        <h3>{l.title}</h3>
                        <span>课本 p.{l.pages.join('-')}</span>
                      </div>
                      <span className="chip neutral">建设中</span>
                    </div>
                  ),
                )}
                {selected.kind === 'unit' && (
                  <Link to={`/questions?unit=${selected.id}`} className="unit-practice-link">
                    <Icon name="NotebookPen" size={18} />
                    本单元练习
                    <Icon name="ArrowRight" size={16} />
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
