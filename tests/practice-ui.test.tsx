// @vitest-environment jsdom
import { configure, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
import App from '../apps/web/src/app/App';
import { app } from '../apps/web/worker';
import { practice, questions } from '@mathstudy/content';
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
  render(<App />);
}
it('guides a student from a topic into one question at a time', async () => {
  open('/');
  await screen.findByRole('heading', { name: '数学题库' });
  const heading = await screen.findByRole('heading', { name: '口算与笔算' });
  fireEvent.click(heading.closest('section')!.querySelector('a')!);
  const first = questions.find(
    (q) => q.id === practice.topics.find((t) => t.id === 'u1-calculation')!.questionIds[0],
  )!;
  await screen.findByRole('heading', { name: first.title });
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect((screen.getByRole('button', { name: '下一题' }) as HTMLButtonElement).disabled).toBe(true);
  for (const f of first.fields.filter((f) => f.fixedValue === undefined))
    fireEvent.change(screen.getByLabelText(f.label), { target: { value: first.expected[f.key] } });
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await screen.findByText('答对了。');
  fireEvent.click(screen.getByRole('button', { name: '下一题' }));
  await waitFor(() => expect(screen.getByText(/第 2 \/ /)).toBeTruthy());
}, 15000);
it('redirects old paper links to classified practice without original scans', async () => {
  open('/practice/papers/P01?original=1');
  await screen.findByRole('heading', { name: '数学题库' });
  expect(screen.queryByRole('button', { name: '原卷' })).toBeNull();
  expect(screen.queryByRole('button', { name: '试卷练习' })).toBeNull();
  expect(screen.queryByRole('img')).toBeNull();
}, 15000);
it('grades a rectangle drawn on the board using individual keyboard-accessible cells', async () => {
  open('/questions/p15-draw');
  await screen.findByRole('heading', { name: '画一个面积18的长方形' });
  for (let y = 1; y <= 3; y++)
    for (let x = 1; x <= 6; x++)
      fireEvent.click(screen.getByRole('button', { name: `第${y}行第${x}列` }));
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await screen.findByText('答对了。');
  expect(screen.getByText('已选18格')).toBeTruthy();
}, 15000);
it('lets the student jump to the complete construction problem, then explicitly self-check it', async () => {
  const topic = practice.topics.find((t) => t.questionIds.includes('full-p15-s4-q1'))!;
  open(`/practice/topics/${topic.id}`);
  const select = await screen.findByRole('combobox', { name: '跳转题目' });
  const index = topic.questionIds.indexOf('full-p15-s4-q1');
  fireEvent.change(select, { target: { value: String(index) } });
  await screen.findByRole('button', { name: '核对解答' });
  expect(screen.queryByRole('button', { name: '核对答案' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '核对解答' }));
  await screen.findByRole('button', { name: '我做对了' });
  fireEvent.click(screen.getByRole('button', { name: '我做对了' }));
  await screen.findByText('已记录：核对通过。');
  expect((screen.getByRole('button', { name: '下一题' }) as HTMLButtonElement).disabled).toBe(
    false,
  );
}, 15000);
it('shows a missing-source explanation without a button to claim the question was solved', async () => {
  open('/questions/full-p16-s4-q3-1');
  await screen.findByText('原始截图材料框的数值缺失，暂不计分。');
  expect(screen.queryByRole('button', { name: '核对答案' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '查看解题方法' }));
  await screen.findByRole('button', { name: '收起解析' });
  expect(screen.queryByRole('button', { name: '我做对了' })).toBeNull();
}, 15000);
it('keeps exact mental calculations to one visible input and retains the compatible submission on redo', async () => {
  open('/questions/full-p17-s2-q1-1');
  await screen.findByRole('heading', { name: '68÷4' });
  expect(screen.getAllByRole('textbox')).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('得数'), { target: { value: '17' } });
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await screen.findByText('答对了。');
  fireEvent.click(screen.getByRole('button', { name: '展开解析' }));
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  fireEvent.change(screen.getByLabelText('得数'), { target: { value: '17' } });
  fireEvent.click(screen.getByRole('button', { name: '核对答案' }));
  await screen.findByText('答对了。');
}, 15000);
