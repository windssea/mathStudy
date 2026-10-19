import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { DataContext, type HomeData } from './course';
import { useRemote } from '../lib/api';
import { Icon, Loading, ErrorState } from '../components/ui';
import { startLearningSync, useAccount } from '../lib/progress';

const Home = lazy(() => import('../features/Home'));
const Catalog = lazy(() => import('../features/Catalog'));
const LessonPage = lazy(() => import('../features/Lesson'));
const QuestionBank = lazy(() => import('../features/QuestionBank'));
const Records = lazy(() => import('../features/Records'));
const Account = lazy(() => import('../features/Account'));
function Shell() {
  const account = useAccount();
  useEffect(() => startLearningSync(), []);
  const remote = useRemote<HomeData>('/home');
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);
  const lesson = location.pathname.includes('/lessons/');
  const title = lesson
    ? '课节学习'
    : location.pathname.startsWith('/questions')
      ? '分层题库'
      : location.pathname.startsWith('/records')
        ? '学习记录'
        : location.pathname.startsWith('/account')
          ? '账号与同步'
          : location.pathname.startsWith('/books')
            ? '课程目录'
            : '学习首页';
  return (
    <>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Icon name="BookOpen" size={25} />
          </span>
          <span>
            数趣<small>MathStudy</small>
          </span>
        </Link>
        <div className="nav-label">我的学习空间</div>
        <nav aria-label="主要导航">
          <NavLink to="/" end>
            <Icon name="LayoutDashboard" />
            学习首页
          </NavLink>
          <NavLink to={remote.data ? `/books/${remote.data.textbook.id}` : '/books'}>
            <Icon name="BookOpen" />
            课程目录
          </NavLink>
          <NavLink to="/questions">
            <Icon name="NotebookPen" />
            分层题库<span className="nav-new">NEW</span>
          </NavLink>
          <NavLink to="/records">
            <Icon name="ListChecks" />
            学习记录
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <Icon name="Lightbulb" size={26} />
          </span>
          <strong>多想一步，多懂一点</strong>
          <p>
            不着急找答案，
            <br />
            先发现数学里的小规律。
          </p>
          <Link to="/questions?difficulty=challenge">
            挑战一道题 <Icon name="ArrowRight" size={15} />
          </Link>
        </div>
        <div className="sidebar-footer">
          <Icon name="GraduationCap" size={19} />
          <span>跟着课本，慢慢学懂</span>
        </div>
      </aside>
      {menu && (
        <button className="menu-scrim" aria-label="关闭菜单" onClick={() => setMenu(false)} />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="打开菜单"
              aria-expanded={menu}
            >
              <Icon name="Menu" />
            </button>
            <span className="breadcrumb">
              <span className="breadcrumb-home">我的学习空间</span>
              <Icon name="ChevronRight" size={14} /> <b>{title}</b>
            </span>
          </div>
          <div className="topbar-right">
            <span className="local-label">
              <span />
              {account.user
                ? account.error
                  ? '待同步'
                  : account.syncing || account.pending
                    ? '正在同步'
                    : '云端已同步'
                : '当前设备学习'}
            </span>
            <Link className="account-link" to="/account">
              {account.user ? account.user.name : '登录同步'}
            </Link>
            <Link className="profile" to="/records" aria-label="查看学习记录">
              数
            </Link>
          </div>
        </header>
        <main id="main" className={`main-content ${lesson ? 'lesson-main' : ''}`} tabIndex={-1}>
          {remote.loading ? (
            <Loading />
          ) : remote.error || !remote.data ? (
            <ErrorState message={remote.error ?? '课程加载失败'} retry={remote.retry} />
          ) : (
            <DataContext value={remote.data}>
              <Suspense fallback={<Loading />}>
                <Routes key={account.user?.id ?? 'guest'}>
                  <Route path="/" element={<Home />} />
                  <Route path="/books/:editionId" element={<Catalog />} />
                  <Route path="/books/:editionId/lessons/:lessonId" element={<LessonPage />} />
                  <Route path="/questions" element={<QuestionBank />} />
                  <Route path="/questions/:questionId" element={<QuestionBank />} />
                  <Route path="/records" element={<Records />} />
                  <Route path="/account" element={<Account />} />
                  <Route
                    path="*"
                    element={<ErrorState message="这一页还没找到，点击左侧导航回到学习。" />}
                  />
                </Routes>
              </Suspense>
            </DataContext>
          )}
        </main>
        <footer className="page-footer">
          <span>数趣 MathStudy</span>
          <span>理解每一步，让数学看得见。</span>
        </footer>
      </div>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
