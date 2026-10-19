import { useState } from 'react';
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

export default function Account() {
  const account = useAccount(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [name, setName] = useState('');
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
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      await authenticate(mode, email, password, name);
      setPassword('');
      const target = params.get('returnTo');
      if (target?.startsWith('/') && !target.startsWith('//') && !target.startsWith('/account'))
        navigate(target, { replace: true });
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">把学习足迹，留在自己的账号里</div>
          <h1>{account.user ? '我的账号' : '登录与同步'}</h1>
          <p>在其他设备登录同一个账号，继续学习、查看答题记录和错题。</p>
        </div>
      </div>
      {account.user ? (
        <div className="account-grid">
          <section className="panel account-panel">
            <span className="account-avatar">{account.user.name.slice(0, 1)}</span>
            <h2>{account.user.name}</h2>
            <p>{account.user.email}</p>
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
              <button
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
              </button>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void run(signOut)}
              >
                退出登录
              </button>
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
              道练习。请确认这些是你的记录，再合并到当前账号。
            </p>
            <p className="account-note">
              账号之间的记录分别保存。合并不会覆盖云端已有学习，也不会删除本机原记录。旧版没有原始答案的条目标为“本机导入”。
            </p>
            <button
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
            </button>
          </section>
        </div>
      ) : (
        <section className="panel account-panel account-form-panel">
          <div className="account-tabs" role="tablist" aria-label="账号操作">
            <button
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              登录
            </button>
            <button
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              注册账号
            </button>
          </div>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <label>
                学习昵称
                <input
                  required
                  maxLength={40}
                  autoComplete="nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：小小探索家"
                />
              </label>
            )}
            <label>
              邮箱
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="用于登录的邮箱"
              />
            </label>
            <label>
              密码
              <span className="password-field">
                <input
                  required
                  type={visible ? 'text' : 'password'}
                  minLength={10}
                  maxLength={128}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-note"
                  aria-label="密码"
                />
                <button type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>
                  {visible ? '隐藏密码' : '显示密码'}
                </button>
              </span>
            </label>
            <p id="password-note" className="account-note">
              密码至少 10 个字符。当前不发送验证或找回邮件，请保存好登录信息。
            </p>
            <button className="button primary" type="submit" disabled={busy || !account.ready}>
              {busy ? '正在处理…' : mode === 'login' ? '登录并同步' : '注册并开始学习'}
              <Icon name="ArrowRight" size={17} />
            </button>
          </form>
          <p className="account-note">
            未登录也可以学习；游客记录留在本机，登录后由你选择是否合并。
          </p>
          {!account.available && account.ready && (
            <p className="inline-error">登录服务暂未配置，请稍后再试。</p>
          )}
        </section>
      )}
      {error && (
        <p className="inline-error account-feedback" role="alert">
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
