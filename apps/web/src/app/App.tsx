import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { DataContext, type HomeData } from './course';
import { useRemote } from '../lib/api';
import { Icon, Loading, ErrorState } from '../components/ui';
import { startLearningSync, useAccount } from '../lib/progress';
import ThemeSwitch from '../components/ThemeSwitch';

const Home = lazy(() => import('../features/Home'));
const Catalog = lazy(() => import('../features/Catalog'));
const LessonPage = lazy(() => import('../features/Lesson'));
const QuestionBank = lazy(() => import('../features/QuestionBank'));
const Records = lazy(() => import('../features/Records'));
const Account = lazy(() => import('../features/Account'));
const Practice = lazy(() => import('../features/Practice'));
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
  const focused =
    lesson ||
    location.pathname.startsWith('/practice/') ||
    /^\/questions\/[^/]+/.test(location.pathname);
  const title = lesson
    ? '知识讲解'
    : location.pathname.startsWith('/questions')
      ? '全部题目'
      : location.pathname.startsWith('/records')
        ? '练习记录'
        : location.pathname.startsWith('/account')
          ? '账号与同步'
          : location.pathname.startsWith('/books')
            ? '课程目录'
            : '练习';
  return (
    <>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
        <Link to="/" className="brand" aria-label="数趣 MathStudy 首页">
          <span className="brand-mark">
            <Icon name="BookOpen" size={25} />
          </span>
          <span>
            数趣<small>MathStudy</small>
          </span>
        </Link>

        <nav aria-label="主要导航">
          <NavLink
            to="/"
            end
            aria-label="练习"
            title="练习"
            className={({ isActive }) =>
              isActive || location.pathname.startsWith('/practice/') ? 'active' : ''
            }
          >
            <Icon name="LayoutDashboard" />
            <span>练习</span>
          </NavLink>

          <NavLink to="/questions" aria-label="全部题目" title="全部题目">
            <Icon name="NotebookPen" />
            <span>全部题目</span>
          </NavLink>
          <NavLink to="/records" aria-label="练习记录" title="练习记录">
            <Icon name="ListChecks" />
            <span>练习记录</span>
          </NavLink>
          <NavLink
            to={remote.data ? `/books/${remote.data.textbook.id}` : '/books'}
            aria-label="课程目录"
            title="课程目录"
          >
            <Icon name="BookOpen" />
            <span>课程目录</span>
          </NavLink>
        </nav>
        <div className="sidebar-course">
          <Icon name="GraduationCap" size={22} />
          <div>
            <strong>四年级上册</strong>
            <small>苏教版数学</small>
          </div>
        </div>
      </aside>
      {menu && (
        <button className="menu-scrim" aria-label="关闭菜单" onClick={() => setMenu(false)} />
      )}
      <div className={`workspace ${focused ? 'is-focused' : ''}`}>
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
              <b>{title}</b>
            </span>
          </div>
          <div className="topbar-right">
            <ThemeSwitch />
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
          </div>
        </header>
        <main
          id="main"
          className={`main-content ${lesson ? 'lesson-main' : ''} ${focused ? 'focus-main' : ''}`}
          tabIndex={-1}
        >
          {remote.loading ? (
            <Loading />
          ) : remote.error || !remote.data ? (
            <ErrorState message={remote.error ?? '课程加载失败'} retry={remote.retry} />
          ) : (
            <DataContext value={remote.data}>
              <Suspense fallback={<Loading />}>
                <Routes key={account.user?.id ?? 'guest'}>
                  <Route path="/" element={<Home />} />
                  <Route path="/practice/:kind/:id" element={<Practice />} />
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
