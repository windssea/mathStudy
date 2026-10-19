import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCourse } from '../app/course';
import { BookArt, Icon, ProgressRing } from '../components/ui';
import { useProgress } from '../lib/progress';
import { trialQuotient } from '@mathstudy/math-core';

export default function Home() {
  const { textbook: book, questionCount, availableLessons } = useCourse();
  const progress = useProgress();
  const all = book.catalog.flatMap((n) => n.lessons).filter((l) => l.available);
  const current = all.find((l) => l.id === progress.lastLessonId) ?? all[0];
  const first = book.catalog.find((n) => n.lessons.some((l) => l.id === current.id))!;
  const [trial, setTrial] = useState<number>();
  const result = trial === undefined ? undefined : trialQuotient(172, 28, trial);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-line" />
            每天一点，学会思考
          </div>
          <h1>今天，一起探索数学吧</h1>
          <p>跟着熟悉的课本，把每一个“为什么”弄明白。</p>
        </div>
        <span className="term-tag">
          <Icon name="BookOpen" size={16} />
          四年级 · 上学期
        </span>
      </div>
      <div className="home-columns">
        <div className="home-primary">
          <section className="textbook-hero" aria-labelledby="my-textbook">
            <div className="hero-copy">
              <span className="hero-kicker">
                <span />
                我的数学课本
              </span>
              <h2 id="my-textbook">
                苏教版数学
                <span>
                  四年级<span className="volume">上册</span>
                </span>
              </h2>
              <p>
                从动手探索到独立解题，
                <br />
                让每一步思考都有迹可循。
              </p>
              <Link className="button hero-button" to={`/books/${book.id}/lessons/${current.id}`}>
                {progress.lastLessonId ? '继续学习' : '开始第一课'}
                <Icon name="ArrowRight" size={18} />
              </Link>
              <div className="hero-meta">
                2026 年第 1 版<span>·</span>6 个单元 · 4 项实践
              </div>
            </div>
            <BookArt />
            <span className="hero-shape shape-a" />
            <span className="hero-shape shape-b" />
          </section>
          <section className="section-block">
            <div className="section-heading">
              <div>
                <span className="section-index">01</span>
                <h2>从这里开始</h2>
              </div>
              <Link className="text-link" to={`/books/${book.id}`}>
                全部课程
                <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
            <div className="unit-feature">
              <div className="unit-feature-top">
                <span className="unit-badge">
                  <Icon name="Blocks" size={22} />
                </span>
                <div>
                  <span className="overline">
                    {first.kind === 'unit'
                      ? `第${['一', '二', '三', '四', '五', '六'][Number(first.id.slice(1)) - 1]}单元`
                      : '动手探索'}
                  </span>
                  <h3>{first.title}</h3>
                </div>
                <span className="page-reference">课本 p.{first.printedRange.join('–')}</span>
              </div>
              <div className="lesson-list">
                {first.lessons
                  .filter((l) => l.available)
                  .map((l, i) => (
                    <Link
                      key={l.id}
                      to={`/books/${book.id}/lessons/${l.id}`}
                      className="lesson-row"
                    >
                      <span
                        className={`lesson-number ${progress.completed.includes(l.id) ? 'done' : ''}`}
                      >
                        {progress.completed.includes(l.id) ? (
                          <Icon name="Check" size={16} />
                        ) : (
                          String(i + 1).padStart(2, '0')
                        )}
                      </span>
                      <div>
                        <h4>{l.title}</h4>
                        <span>
                          {l.minutes} 分钟探索 · p.{l.pages.join('–')}
                        </span>
                      </div>
                      <span className="lesson-action">
                        {progress.completed.includes(l.id) ? '再学一遍' : '去学习'}
                        <Icon name="ChevronRight" size={16} />
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        </div>
        <aside className="home-secondary">
          <section className="panel progress-panel">
            <div className="small-panel-heading">
              <h2>我的学习足迹</h2>
              <Icon name="Flag" size={18} />
            </div>
            <ProgressRing value={progress.completed.length} total={availableLessons} />
            <h3>{progress.completed.length ? '每一步，都有新收获' : '第一步，就从今天开始'}</h3>
            <p>两个单元与一项实践 · 已开放 {availableLessons} 个课节</p>
            <div className="progress-panel-bottom">
              <div>
                <b>{Object.keys(progress.answers).length}</b>
                <span>已练题目</span>
              </div>
              <div>
                <b>{Object.values(progress.answers).filter((a) => a.independentCorrect).length}</b>
                <span>独立做对</span>
              </div>
            </div>
            <Link to="/records" className="text-link">
              查看学习记录
              <Icon name="ArrowRight" size={15} />
            </Link>
          </section>
          <section className="experiment-card">
            <div className="experiment-label">
              <Icon name="Sparkles" size={17} />
              动手试一试
            </div>
            <h2>这个商，合适吗？</h2>
            <p>172 本书，每箱放 28 本。</p>
            <div className="trial-equation">
              172 <span>÷</span> 28 <span>≈</span> <b>{trial ?? '?'}</b>
            </div>
            <div className="trial-options" role="group" aria-label="选择试商">
              {[5, 6, 7].map((n) => (
                <button
                  className={trial === n ? 'selected' : ''}
                  key={n}
                  onClick={() => setTrial(n)}
                  aria-pressed={trial === n}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="trial-feedback" aria-live="polite">
              {result
                ? result.verdict === 'small'
                  ? '余下 32 本，还能再装一箱，商偏小了。'
                  : result.verdict === 'large'
                    ? '28 × 7 超过 172，商偏大了。'
                    : '对！商 6，余下 4 本，不够再装一箱。'
                : '先猜一个商，再看看会发生什么。'}
            </p>
            <Link className="text-link" to={`/books/${book.id}/lessons/U01-L02`}>
              看看完整演示
              <Icon name="ArrowRight" size={15} />
            </Link>
          </section>
        </aside>
      </div>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="section-index">02</span>
            <h2>一本课本，更多发现</h2>
          </div>
          <Link className="text-link" to={`/books/${book.id}`}>
            查看教材目录
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
        <div className="subject-grid">
          {book.catalog
            .filter((n) => n.kind === 'unit')
            .slice(1)
            .map((n, i) => (
              <Link
                className={`subject-card tone-${i % 4}`}
                to={`/books/${book.id}#${n.id}`}
                key={n.id}
              >
                <span className="subject-symbol">
                  <Icon
                    name={
                      ['Shapes', 'MoveUpRight', 'Grid2X2', 'Blocks', 'NotebookPen'][i] as 'Shapes'
                    }
                    size={26}
                  />
                </span>
                <span className="overline">第{['二', '三', '四', '五', '六'][i]}单元</span>
                <h3>{n.title}</h3>
                <span className="subject-status">
                  {n.lessons.some((l) => l.available)
                    ? `已开放 ${n.lessons.filter((l) => l.available).length} 课 · 去学习`
                    : '课节建设中'}
                  <Icon name="ArrowRight" size={15} />
                </span>
              </Link>
            ))}
        </div>
      </section>
      <section className="bank-banner">
        <span className="bank-banner-icon">
          <Icon name="NotebookPen" size={28} />
        </span>
        <div>
          <h2>学会了？来一道题试试</h2>
          <p>{questionCount} 道原创题 · 六个单元 · 从基础到挑战，每题都有分析</p>
        </div>
        <Link className="button secondary" to="/questions">
          进入分层题库
          <Icon name="ArrowRight" size={17} />
        </Link>
      </section>
    </>
  );
}
