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
it('grades a new bracket choice and keeps its step diagrams collapsed until requested', async () => {
  window.history.replaceState({}, '', '/questions/bank-u4-brackets-04');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  render(<App />);
  const radios = await screen.findAllByRole('radio');
  expect(radios).toHaveLength(4);
  expect(screen.queryByRole('img')).toBeNull();
  fireEvent.click(radios[1]);
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await screen.findByText('答对了。');
  expect(screen.queryByRole('img')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '展开解析' }));
  const first = screen.getByRole('img').querySelector('image')?.getAttribute('href');
  expect(first).toContain('bank-u4-brackets-04-step1.svg');
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByRole('img').querySelector('image')?.getAttribute('href')).toContain(
    'bank-u4-brackets-04-step2.svg',
  );
}, 15000);
it('keeps a new reasoning exercise focused until its explanation is requested', async () => {
  window.history.replaceState({}, '', '/questions/u1-17');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  render(<App />);
  await screen.findByRole('heading', { name: '除数看错了，怎样还原', level: 1 });
  expect(screen.queryByRole('img')).toBeNull();
  fireEvent.change(screen.getByLabelText('你的答案'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await screen.findByText('答对了。');
  expect(screen.queryByRole('img')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '展开解析' }));
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('737');
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(screen.getByRole('img').textContent).toContain('46×16＝736');
  fireEvent.click(screen.getByRole('button', { name: '收起解析' }));
  expect(screen.queryByRole('img')).toBeNull();
}, 15000);
it('connects fifth-unit reading exploration, fill-in/choice grading and completion', async () => {
  window.history.replaceState({}, '', '/books/sj-math-g4-upper-2026-v1/lessons/U05-L02');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  render(<App />);
  await screen.findByRole('heading', { name: '万级数的读写与比较' });
  expect(screen.getByRole('combobox', { name: '本单元课节' })).toBeTruthy();
  fireEvent.change(screen.getByRole('slider', { name: '演示步骤' }), {
    target: { value: screen.getByRole('slider').getAttribute('max') },
  });
  fireEvent.click(screen.getByRole('tab', { name: /自己试一试/ }));
  const articles = screen.getAllByRole('article');
  fireEvent.click(screen.getByRole('radio', { name: /78900000/ }));
  fireEvent.submit(articles[0].querySelector('form')!);
  fireEvent.click(screen.getByRole('radio', { name: /三百万八千零七/ }));
  fireEvent.submit(articles[1].querySelector('form')!);
  fireEvent.change(articles[2].querySelector('input')!, { target: { value: '20022000' } });
  fireEvent.submit(articles[2].querySelector('form')!);
  await waitFor(() => expect(screen.getAllByText('答对了。')).toHaveLength(3));
  fireEvent.click(screen.getByRole('button', { name: '完成本课' }));
  expect(screen.getByRole('link', { name: '继续下一课' }).getAttribute('href')).toContain(
    'U05-L03',
  );
}, 15000);
it('connects fourth-unit bracket exploration, grading and completion to the shared learning flow', async () => {
  window.history.replaceState({}, '', '/books/sj-math-g4-upper-2026-v1/lessons/U04-L02');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  render(<App />);
  await screen.findByRole('heading', { name: '小括号与中括号' });
  expect(screen.getByRole('combobox', { name: '本单元课节' })).toBeTruthy();
  fireEvent.change(screen.getByRole('slider', { name: /演示步骤/ }), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('tab', { name: /自己试一试/ }));
  const articles = screen.getAllByRole('article');
  for (const [index, value] of ['7', '9', '8'].entries()) {
    fireEvent.change(articles[index].querySelector('input')!, { target: { value } });
    fireEvent.submit(articles[index].querySelector('form')!);
  }
  await waitFor(() => expect(screen.getAllByText('答对了。')).toHaveLength(3));
  fireEvent.click(screen.getByRole('button', { name: '完成本课' }));
  expect(screen.getByRole('link', { name: '继续下一课' }).getAttribute('href')).toContain(
    'U04-L03',
  );
}, 15000);
it('connects third-unit exploration, existing exercises and course completion', async () => {
  window.history.replaceState({}, '', '/books/sj-math-g4-upper-2026-v1/lessons/U03-L03');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    app.request(new URL(input, 'http://localhost').href, init),
  );
  render(<App />);
  await screen.findByRole('heading', { name: '速度、时间与路程' });
  expect(screen.getByRole('combobox', { name: '本单元课节' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '查看静态步骤' }));
  fireEvent.click(screen.getByRole('tab', { name: /自己试一试/ }));
  const articles = screen.getAllByRole('article');
  fireEvent.change(articles[0].querySelector('input')!, { target: { value: '280' } });
  fireEvent.submit(articles[0].querySelector('form')!);
  fireEvent.click(screen.getByLabelText(/路程 ÷ 速度/));
  fireEvent.submit(articles[1].querySelector('form')!);
  fireEvent.change(articles[2].querySelector('input')!, { target: { value: '180' } });
  fireEvent.submit(articles[2].querySelector('form')!);
  await waitFor(() => expect(screen.getAllByText('答对了。')).toHaveLength(3));
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
  await screen.findByRole('heading', { name: '数学题库' });
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
  await screen.findByText('答对了。');
  fireEvent.click(screen.getByRole('link', { name: /全部题目/ }));
  await screen.findByRole('heading', { name: '全部题目' });
  fireEvent.change(screen.getByRole('combobox', { name: '难度' }), {
    target: { value: 'challenge' },
  });
  await waitFor(() => expect(document.querySelectorAll('a.question-card').length).toBe(12));
  fireEvent.click(screen.getByRole('link', { name: /剪去一角，面积怎么变/ }));
  fireEvent.click(await screen.findByRole('button', { name: '解析' }));
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
  expect(screen.getByRole('combobox', { name: '本单元课节' })).toBeTruthy();
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
  await waitFor(() => expect(screen.getAllByText('答对了。')).toHaveLength(3));
  fireEvent.click(screen.getByRole('button', { name: '完成本课' }));
  expect(screen.getByRole('link', { name: '继续下一课' }).getAttribute('href')).toContain(
    'U02-L06',
  );
  fireEvent.click(screen.getByRole('link', { name: '进入本单元题库' }));
  await screen.findByRole('heading', { name: '全部题目' });
  await waitFor(() => expect(document.querySelectorAll('a.question-card')).toHaveLength(12));
  fireEvent.change(screen.getByRole('combobox', { name: '难度' }), {
    target: { value: 'challenge' },
  });
  fireEvent.click(await screen.findByRole('link', { name: /同面积的最短周长/ }));
  fireEvent.click(await screen.findByRole('button', { name: '解析' }));
  const image = await screen.findByRole('img', { name: /36个单位方格/ });
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(image.getAttribute('aria-label')).toContain('周长24厘米');
}, 15000);
