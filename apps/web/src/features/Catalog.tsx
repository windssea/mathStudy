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
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' });
    }
  }, [location.hash]);
  if (editionId !== book.id) return <ErrorState message="未找到这本教材。" />;
  const nodes = book.catalog.filter(
    (n) =>
      (!onlyOpen || n.lessons.some((l) => l.available)) &&
      (!search || `${n.title}${n.lessons.map((l) => l.title).join('')}`.includes(search)),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>课程目录</h1>
          <p>按教材顺序学习，或搜索课节。</p>
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
          <span>已开放课节 / 规划课节</span>
        </div>
      </section>
      <div className="filter-toolbar">
        <label className="search-box">
          <Icon name="Search" size={19} />
          <input
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
      <div className="catalog-list">
        {nodes.length === 0 && (
          <div className="empty-state">
            <Icon name="Search" size={30} />
            <h2>没有找到匹配的课程</h2>
            <p>换个关键词，或关闭“只看已开放”。</p>
          </div>
        )}
        {nodes.map((n) => (
          <section
            className={`catalog-node panel ${n.id === expanded ? 'expanded' : ''}`}
            key={n.id}
            id={n.id}
          >
            <button
              className="catalog-node-head"
              onClick={() => setExpanded(n.id === expanded ? '' : n.id)}
              aria-expanded={n.id === expanded}
              aria-controls={`content-${n.id}`}
            >
              <span className={`catalog-node-icon ${n.kind !== 'unit' ? 'activity-icon' : ''}`}>
                {n.kind === 'unit' ? (
                  n.id.slice(1)
                ) : (
                  <Icon name={n.kind === 'activity' ? 'Lightbulb' : 'Flag'} />
                )}
              </span>
              <span className="catalog-node-title">
                <span className="overline">
                  {n.kind === 'unit'
                    ? `第${['一', '二', '三', '四', '五', '六'][Number(n.id.slice(1)) - 1]}单元`
                    : n.kind === 'activity'
                      ? '动手探索 · 综合实践'
                      : '回顾与整理'}
                </span>
                <h2>{n.title}</h2>
              </span>
              <span className="catalog-node-meta">
                p.{n.printedRange.join('–')}
                <span>
                  {n.lessons.length} 个课节
                  {!n.lessons.some((l) => l.available) ? ' · 建设中' : ' · 已开放'}
                </span>
              </span>
              <Icon name="ChevronDown" className="expand-icon" />
            </button>
            {expanded === n.id && (
              <div id={`content-${n.id}`} className="catalog-lessons">
                {n.lessons.map((l, index) =>
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
                          课本 p.{l.pages.join('–')} · {l.minutes} 分钟
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

                        <span>课本 p.{l.pages.join('–')}</span>
                      </div>
                      <span className="chip neutral">建设中</span>
                    </div>
                  ),
                )}
                {n.kind === 'unit' && (
                  <Link to={`/questions?unit=${n.id}`} className="unit-practice-link">
                    <Icon name="NotebookPen" size={18} />
                    本单元练习
                    <Icon name="ArrowRight" size={16} />
                  </Link>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
