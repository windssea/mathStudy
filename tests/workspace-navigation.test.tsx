// @vitest-environment jsdom
import { cleanup, configure, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../apps/web/src/app/App';
import { app } from '../apps/web/worker';

configure({ asyncUtilTimeout: 5000 });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function open(path: string) {
  window.history.replaceState({}, '', path);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  return render(<App />);
}

it('keeps unit ordinals stable across inserted activities and catalog search', async () => {
  open('/books/sj-math-g4-upper-2026-v1#U06');
  const unit = await screen.findByRole('button', { name: /大数的运算/ });
  expect(unit.querySelector('.unit-index')?.textContent).toBe('6');
  expect(
    screen.getByRole('button', { name: /乘法数量关系/ }).querySelector('.unit-index')?.textContent,
  ).toBe('3');
  expect(screen.getByRole('link', { name: '学本单元方法' }).getAttribute('href')).toBe(
    '/?unit=U06&view=methods',
  );
  fireEvent.change(screen.getByRole('textbox', { name: '搜索课程' }), {
    target: { value: '大数的运算' },
  });
  expect(
    screen.getByRole('button', { name: /大数的运算/ }).querySelector('.unit-index')?.textContent,
  ).toBe('6');
}, 15000);

it('starts the first unit with oral and written division before isolated unit conversion', async () => {
  open('/?unit=U01');
  await screen.findByRole('heading', { name: '口算与估算' });
  const titles = screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent);
  expect(titles.slice(0, 2)).toEqual(['口算与估算', '除法竖式']);
  expect(titles.indexOf('时间与长度单位换算')).toBeGreaterThan(1);
});

it('shows the current lesson reason beside its drawing and updates it with the same step state', async () => {
  const { container } = open('/books/sj-math-g4-upper-2026-v1/lessons/U03-L01');
  await screen.findByRole('heading', { name: '乘法意义与乘除互逆' });
  const reason = container.querySelector('.lesson-current-step')! as HTMLElement;
  expect(within(reason).getByText('找出两个已知量')).toBeTruthy();
  expect(container.querySelector('.quantity-player .narration')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(within(reason).getByText('先看一份和几份')).toBeTruthy();
  expect(screen.getByRole('img', { name: /已展示1份/ })).toBeTruthy();
});
