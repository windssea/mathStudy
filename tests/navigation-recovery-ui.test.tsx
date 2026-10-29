// @vitest-environment jsdom
import { useState } from 'react';
import {
  act,
  cleanup,
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../apps/web/src/app/App';
import { GridEditor } from '../apps/web/src/components/GridExercise';
import { app } from '../apps/web/worker';
import { recordAnswer } from '../apps/web/src/lib/progress';

configure({ asyncUtilTimeout: 6000 });
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
function open(path: string, observed: string[] = []) {
  window.history.replaceState({}, '', path);
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    observed.push(String(input));
    return app.request(new URL(input, 'http://localhost').href, init);
  });
  render(<App />);
}

describe('navigation and local recovery', () => {
  it('keeps list origin and selected preview across an exercise roundtrip', async () => {
    open('/questions?unit=U04&page=2');
    const list = await screen.findByRole('region', { name: '题目列表' });
    await waitFor(() =>
      expect(within(list).getAllByRole('button', { pressed: false }).length).toBeGreaterThan(1),
    );
    fireEvent.click(within(list).getAllByRole('button', { pressed: false })[0]);
    const previewId = new URLSearchParams(window.location.search).get('preview');
    fireEvent.click(screen.getByRole('link', { name: '开始练习' }));
    const back = await screen.findByRole('link', { name: '返回题库' });
    expect(back.getAttribute('href')).toContain('unit=U04&page=2');
    fireEvent.click(back);
    await screen.findByRole('region', { name: '题目列表' });
    expect(new URLSearchParams(window.location.search).get('preview')).toBe(previewId);
    expect((screen.getByLabelText('单元') as HTMLSelectElement).value).toBe('U04');
  }, 20000);
  it('synchronizes search text when browser navigation restores URL filters', async () => {
    open('/questions?unit=U04&search=审查无匹配XYZ');
    fireEvent.click(await screen.findByRole('button', { name: '重置筛选' }));
    await screen.findByRole('region', { name: '题目列表' });
    act(() => {
      window.history.replaceState({}, '', '/questions?unit=U04&search=审查无匹配XYZ');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await screen.findByRole('button', { name: '重置筛选' });
    expect((screen.getByLabelText('搜索题目') as HTMLInputElement).value).toBe('审查无匹配XYZ');
  }, 20000);
  it('looks up only the currently displayed recorded questions', async () => {
    const observed: string[] = [];
    act(() => {
      recordAnswer('u4-03', false, false);
    });
    open('/records', observed);
    await screen.findByRole('heading', { name: '练习记录', level: 1 });
    await waitFor(() =>
      expect(observed.some((url) => url.includes('scope=history&ids='))).toBe(true),
    );
    expect(observed).not.toContain('/api/v1/questions?scope=history');
    expect(document.activeElement?.id).toBe('main');
    expect(document.title).toBe('练习记录 · 数趣');
  }, 15000);
  it('keeps a single grid tab stop, moves around given cells and can undo clearing', () => {
    function Drawing() {
      const [value, setValue] = useState('010000');
      return (
        <GridEditor
          task={{ rows: 2, columns: 3, given: [1], area: 3, rectangle: false }}
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Drawing />);
    const board = screen.getByRole('group', { name: '方格作图' });
    expect(board.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    const first = screen.getByRole('button', { name: '第1行第1列' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '第1行第3列' }));
    fireEvent.click(document.activeElement!);
    expect(screen.getByRole('button', { name: '第1行第3列' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: '清空作图' }));
    expect(screen.getByRole('button', { name: '第1行第3列' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(screen.getByRole('button', { name: '第1行第3列' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    fireEvent.keyDown(board, { key: 'z', ctrlKey: true });
    expect(screen.getByRole('button', { name: '第1行第3列' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(screen.getByRole('button', { name: /已知方格/ }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
  it('returns from a recorded question to the same review filter', async () => {
    act(() => {
      recordAnswer('u4-03', false, false);
      recordAnswer('u4-03', true, false);
    });
    open('/records?review=resolved');
    const heading = await screen.findByRole('heading', { name: '错题与复习' });
    fireEvent.click(
      await within(heading.closest('section')!).findByRole('link', { name: /中括号与小括号/ }),
    );
    const back = await screen.findByRole('link', { name: '返回记录' });
    expect(back.getAttribute('href')).toBe('/records?review=resolved');
    fireEvent.click(back);
    await screen.findByRole('heading', { name: '练习记录', level: 1 });
    expect(screen.getByRole('button', { name: '已掌握' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  }, 15000);
  it('places failed login feedback inside the form and focuses it', async () => {
    open('/account?returnTo=%2Fquestions%3Funit%3DU04');
    const submit = await screen.findByRole('button', { name: '登录并同步' });
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText('账号'), { target: { value: 'test-only' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'test-only' } });
    fireEvent.submit(submit.closest('form')!);
    const error = await screen.findByRole('alert');
    expect(error.closest('form')).toBeTruthy();
    expect(document.activeElement).toBe(error);
    expect(screen.getByRole('link', { name: '继续练习' }).getAttribute('href')).toBe(
      '/questions?unit=U04',
    );
  }, 15000);
});
