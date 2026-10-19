// @vitest-environment jsdom
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../apps/web/src/app/App';
import { app } from '../apps/web/worker';

// Lazy route imports share CPU with the auth/DOM suites in hosted builds.
// Keep assertions unchanged and wait for their result with a bounded CI budget.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it('connects third-unit exploration, existing exercises and course completion', async () => {
  window.history.replaceState({}, '', '/books/sj-math-g4-upper-2026-v1/lessons/U03-L03');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  render(<App />);
  await screen.findByRole('heading', { name: '速度、时间与路程' });
  expect(screen.getByRole('heading', { name: '第三单元的探索路线' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '查看静态步骤' }));
  fireEvent.click(screen.getByRole('tab', { name: /自己试一试/ }));
  const articles = screen.getAllByRole('article');
  fireEvent.change(articles[0].querySelector('input')!, { target: { value: '280' } });
  fireEvent.submit(articles[0].querySelector('form')!);
  fireEvent.click(screen.getByLabelText(/路程 ÷ 速度/));
  fireEvent.submit(articles[1].querySelector('form')!);
  fireEvent.change(articles[2].querySelector('input')!, { target: { value: '180' } });
  fireEvent.submit(articles[2].querySelector('form')!);
  await waitFor(() =>
    expect(screen.getAllByText('答对了！再看看思路，理解为什么。')).toHaveLength(3),
  );
  fireEvent.click(screen.getByRole('button', { name: '完成本课' }));
  expect(screen.getByRole('link', { name: '继续下一课' }).getAttribute('href')).toContain(
    'U03-L04',
  );
});
it('connects the homepage, catalog, first lesson, and visual question explanations to the real API', async () => {
  window.history.replaceState({}, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  render(<App />);
  await screen.findByRole('heading', { name: '今天，一起探索数学吧' });
  fireEvent.click(screen.getByRole('link', { name: '课程目录' }));
  await screen.findByRole('heading', { name: '课程目录' });
  fireEvent.click(screen.getByRole('link', { name: /1 整十数除法与分组意义/ }));
  await screen.findByRole('heading', { name: '整十数除法与分组意义' });
  fireEvent.click(await screen.findByRole('tab', { name: /自己试一试/ }));
  const first = screen.getAllByRole('article')[0];
  fireEvent.change(first.querySelector('input[name="u1-01-quotient"]')!, {
    target: { value: '3' },
  });
  fireEvent.change(first.querySelector('input[name="u1-01-remainder"]')!, {
    target: { value: '0' },
  });
  fireEvent.submit(first.querySelector('form')!);
  await screen.findByText('答对了！再看看思路，理解为什么。');
  fireEvent.click(screen.getByRole('link', { name: /分层题库/ }));
  await screen.findByRole('heading', { name: '分层题库' });
  fireEvent.change(screen.getByRole('combobox', { name: '难度' }), {
    target: { value: 'challenge' },
  });
  await waitFor(() => expect(document.querySelectorAll('a.question-card').length).toBe(14));
  fireEvent.click(screen.getByRole('link', { name: /剪去一角，面积怎么变/ }));
  fireEvent.click(await screen.findByRole('button', { name: '我想先看讲解' }));
  await screen.findByRole('img', { name: /完整面积减去剪去的部分/ });
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('剩余面积是 132 平方厘米');
}, 15000);

it('connects unit two exploration, bank grading, and the activity through the shared learning flow', async () => {
  window.history.replaceState({}, '', '/books/sj-math-g4-upper-2026-v1/lessons/U02-L05');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  render(<App />);
  await screen.findByRole('heading', { name: '长方形与正方形面积' });
  expect(screen.getByText('第二单元 · 第 5 课')).toBeTruthy();
  expect(screen.getByRole('heading', { name: '第二单元的探索路线' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '铺一排' }));
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('已铺8格');
  fireEvent.click(screen.getByRole('button', { name: '铺满方格' }));
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByText('S = 8 × 5 = 40 平方厘米')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: /自己试一试/ }));
  const articles = screen.getAllByRole('article');
  for (const [i, value] of ['54', '360', '132'].entries()) {
    fireEvent.change(articles[i].querySelector('input')!, { target: { value } });
    fireEvent.submit(articles[i].querySelector('form')!);
  }
  await waitFor(() =>
    expect(screen.getAllByText('答对了！再看看思路，理解为什么。')).toHaveLength(3),
  );
  fireEvent.click(screen.getByRole('button', { name: '完成本课' }));
  expect(screen.getByRole('link', { name: '继续下一课' }).getAttribute('href')).toContain(
    'U02-L06',
  );
  fireEvent.click(screen.getByRole('link', { name: '进入本单元题库' }));
  await screen.findByRole('heading', { name: '分层题库' });
  await waitFor(() => expect(document.querySelectorAll('a.question-card')).toHaveLength(18));
  fireEvent.click(screen.getByRole('link', { name: /同面积的最短周长/ }));
  fireEvent.click(await screen.findByRole('button', { name: '我想先看讲解' }));
  const image = await screen.findByRole('img', { name: /36个单位方格/ });
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(image.getAttribute('aria-label')).toContain('周长24厘米');
}, 15000);
