import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  authenticate,
  guestImportInfo,
  importGuest,
  progressMessage,
  signOut,
  synchronize,
  useAccount,
} from '../lib/progress';
import { Icon } from '../components/ui';
import { safeReturnTo } from '../lib/navigation';

export default function Account() {
  const account = useAccount(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [username, setUsername] = useState(''),
    [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作未完成，请重试。');
    } finally {
      setBusy(false);
    }
  }
  const guest = guestImportInfo();
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const returnTo = params.get('returnTo');
  const practiceTarget = safeReturnTo(returnTo);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      await authenticate(username, password);
      setPassword('');
      if (params.has('returnTo')) navigate(practiceTarget, { replace: true });
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{account.user ? '我的账号' : '账号登录'}</h1>
          <p>登录后，可在其他设备继续学习。</p>
        </div>
      </div>
      {account.user ? (
        <div className="account-grid">
          <section className="panel account-panel">
            <span className="account-avatar">{account.user.name.slice(0, 1)}</span>
            <h2>{account.user.name}</h2>
            <p className="sync-status" role="status">
              {progressMessage()}
            </p>
            {account.lastSynced && (
              <p className="account-note">
                最近同步：
                {new Date(account.lastSynced).toLocaleString('zh-CN', {
                  timeZone: 'Asia/Shanghai',
                })}
              </p>
            )}
            <div className="account-actions">
              <Button
                variant="default"
                className="button primary"
                disabled={busy || account.syncing}
                onClick={() =>
                  void run(async () => {
                    await synchronize();
                    setMessage('已同步最新记录。');
                  })
                }
              >
                <Icon name="RotateCcw" size={17} />
                立即同步
              </Button>
              <Button
                variant="outline"
                className="button secondary"
                disabled={busy}
                onClick={() => void run(signOut)}
              >
                退出登录
              </Button>
            </div>
            <Link className="text-link" to="/records">
              查看学习记录
              <Icon name="ArrowRight" size={16} />
            </Link>
          </section>
          <section className="panel account-panel">
            <h2>合并本机学习记录</h2>
            <p>
              本机游客记录包含 {guest.lessons} 个已完成课节、{guest.questions}{' '}
              道练习。请确认这些是当前账号的记录，再合并。
            </p>
            <p className="account-note">
              同一个内置账号在不同设备共享记录。合并不会删除本机原记录；旧版没有原始答案的条目标为“本机导入”。
            </p>
            <Button
              variant="outline"
              className="button secondary"
              disabled={busy || account.syncing || guest.events === 0}
              onClick={() =>
                void run(async () => {
                  await importGuest();
                  setMessage('本机记录已合并到当前账号。');
                })
              }
            >
              {guest.events ? '合并本机学习记录' : '本机记录已合并'}
            </Button>
          </section>
        </div>
      ) : (
        <section className="panel account-panel account-form-panel">
          <p className="account-note">使用老师或家长提供的账号。</p>
          <form onSubmit={submit} aria-describedby={error ? 'account-form-error' : undefined}>
            <label>
              账号
              <Input
                required
                name="username"
                maxLength={32}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
              />
            </label>
            <label>
              密码
              <span className="password-field">
                <Input
                  required
                  name="password"
                  type={visible ? 'text' : 'password'}
                  maxLength={128}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label="密码"
                />
                <button type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>
                  {visible ? '隐藏密码' : '显示密码'}
                </button>
              </span>
            </label>
            {error && (
              <p
                id="account-form-error"
                ref={errorRef}
                tabIndex={-1}
                className="inline-error"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button
              variant="default"
              className="button primary"
              type="submit"
              disabled={busy || !account.ready}
            >
              {busy ? '正在处理…' : '登录并同步'}
              <Icon name="ArrowRight" size={17} />
            </Button>
          </form>
          <p className="account-note">
            未登录也可以学习；游客记录留在本机，登录后由你选择是否合并。
          </p>
          <Link className="text-link" to={practiceTarget}>
            继续练习
            <Icon name="ArrowRight" size={17} />
          </Link>
          {!account.available && account.ready && (
            <p className="inline-error">登录服务暂未配置，请稍后再试。</p>
          )}
        </section>
      )}
      {error && account.user && (
        <p ref={errorRef} tabIndex={-1} className="inline-error account-feedback" role="alert">
          {error}
        </p>
      )}
      {account.error && !error && (
        <p className="inline-error account-feedback" role="alert">
          {account.error} 待同步记录会保留。
        </p>
      )}
      {message && (
        <p className="account-feedback" role="status">
          {message}
        </p>
      )}
    </>
  );
}
